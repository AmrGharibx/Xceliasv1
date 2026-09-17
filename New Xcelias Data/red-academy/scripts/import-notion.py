#!/usr/bin/env python3
"""Lossless, repeatable import of RED's Notion Markdown/CSV export.

Only writes a NEW database. Never overwrites a live database. All decisions and
original academy pages are retained in authenticated source_records. Uses only
Python's standard library. Run with --help for usage.
"""
from __future__ import annotations
import argparse, collections, csv, datetime as dt, hashlib, io, json, re, sqlite3
import unicodedata, urllib.parse, uuid, zipfile
from pathlib import Path
from zoneinfo import ZoneInfo

KINDS = {'Batches (Master DB)':'batches', 'Trainees (Master DB)':'trainees',
         'Daily Attendance Log (Master DB)':'daily', 'Assessments (Master DB)':'assessments',
         'Attendance (10-Day Log)':'checklists'}
TABLE = {'batches':'batches','trainees':'trainees','daily':'daily_attendance',
         'assessments':'assessments','checklists':'attendance_10day'}
KEYS = {
 'batches':['Assessments','Status','Trainees','Attendance Logs','Date Range'],
 'trainees':['Assessment','Batch','Company','Attendance Logs'],
 'daily':['Batch','Date','Entry ID','Is Late?','Minutes Late','Status','Trainee 1','Was Late?','Arrival Time','Departure Time','Absence Reason'],
 'assessments':['Assessment For (Trainee) 1','Assessment Outcome','Batch','Instructor Comment','Mapping','Product Knowledge','Presentability','Tech Score %','Soft Skills','Soft Score %','Overall %','Company','Assessment AI Report','Absence ','Attendance '],
 'checklists':['Batch',*[f'Day {i}' for i in range(1,11)],'Period End','Period Start','Trainee','Checklist Status','Absent (10 days)','Daily Entries','Late (10 days)','Present (10 days)','Completion %','Assessments','Attendance AI Report']}
TITLE = {'batches':'Batch Name','trainees':'Trainee Name','daily':'Title','assessments':'Assessment Title','checklists':'Record'}
SCORE_KEYS = {'mapping':'Mapping','product_knowledge':'Product Knowledge','presentability':'Presentability','soft_skills':'Soft Skills'}
NS = uuid.NAMESPACE_URL

def uid(value: str) -> str: return str(uuid.uuid5(NS, 'https://red.academy/notion/' + value))
def clean(value: str) -> str: return ' '.join(unicodedata.normalize('NFC', value).split())
def norm(value: str) -> str: return clean(value).casefold()
def number(value: str | None):
 if value is None or value.strip()=='': return None
 n=float(value)
 if not (-1e8 < n < 1e8): raise ValueError('Non-finite/out-of-range source number')
 return int(n) if n.is_integer() else n

def date(value: str | None) -> str | None:
 if not value: return None
 m=re.match(r'^([A-Za-z]+ \d{1,2}, \d{4})(?:$| \d)',value.strip())
 if not m:raise ValueError('Unrecognized date: '+value)
 return dt.datetime.strptime(m[1], '%B %d, %Y').date().isoformat()

def timestamp(value: str | None):
 if not value: return None
 # A date without a time is not a midnight check-in.
 if not re.search(r'\d:\d',value): date(value); return None
 m=re.fullmatch(r'(.+?)\s+\(GMT([+-]\d{1,2})(?::(\d{2}))?\)',value.strip())
 if not m: raise ValueError('Unrecognized timestamp: '+value)
 wall=None
 for fmt in ['%B %d, %Y %I:%M %p','%B %d, %Y %I:%M:%S %p']:
  try: wall=dt.datetime.strptime(m[1],fmt); break
  except ValueError: pass
 if wall is None: raise ValueError('Unrecognized timestamp: '+value)
 offset=int(m[2])*60 + (1 if int(m[2])>=0 else -1)*int(m[3] or 0)
 return wall.replace(tzinfo=dt.timezone(dt.timedelta(minutes=offset))).astimezone(dt.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')

def parse_export(path: Path):
 pages={}; csvs=[]; inventory=[]
 with zipfile.ZipFile(path) as z:
  for item in z.infolist():
   if item.is_dir(): continue
   p=Path(item.filename)
   if p.is_absolute() or '..' in p.parts: raise ValueError('Unsafe archive path')
   if item.file_size>20_000_000: raise ValueError('Unexpectedly large source file')
   inventory.append({'path':item.filename,'bytes':item.file_size})
   if p.suffix.lower()=='.csv':
    csvs.append((item.filename,list(csv.DictReader(io.StringIO(z.read(item).decode('utf-8-sig'))))))
   if p.suffix.lower()!='.md': continue
   kind=next((v for k,v in KINDS.items() if k in p.parent.name),None)
   if not kind: continue
   m=re.search(r'([0-9a-f]{32})\.md$',p.name)
   if not m: raise ValueError('Missing Notion page identifier: '+item.filename)
   data=z.read(item); raw=data.decode('utf-8-sig'); heading=raw.split('\n\n',1)[0];content=raw[len(heading):]
   matches=list(re.finditer(r'^('+'|'.join(re.escape(k) for k in KEYS[kind])+r'): ?',content,re.M))
   props={match[1]:content[match.end():matches[i+1].start() if i+1<len(matches) else len(content)].strip('\n') for i,match in enumerate(matches)}
   page={'id':m[1],'kind':kind,'title':clean(heading.removeprefix('# ')), 'source_title':heading.removeprefix('# '),
         'props':props,'raw':raw,'path':item.filename,'sha256':hashlib.sha256(data).hexdigest()}
   page['refs']={k:re.findall(r'([0-9a-f]{32})\.md',urllib.parse.unquote(v)) for k,v in props.items() if '.md' in v}
   if page['id'] in pages and pages[page['id']]['sha256']!=page['sha256']:raise ValueError('Conflicting copies of a Notion page')
   pages[page['id']]=page
 checks=[]
 for filename,rows in csvs:
  kind=next((v for k,v in KINDS.items() if k in Path(filename).name),None)
  if not kind:continue
  fields=list(rows[0]) if rows else []; title=TITLE[kind]
  a=collections.Counter(tuple(r.get(k,'').strip() for k in fields) for r in rows)
  b=collections.Counter(tuple((('' if p['source_title']=='Untitled' else p['source_title']) if k==title else p['props'].get(k,'')).strip() for k in fields) for p in pages.values() if p['kind']==kind)
  missing=a-b
  if missing: raise ValueError(f'CSV/page disagreement in {filename}: {sum(missing.values())} rows')
  checks.append({'file':filename,'kind':kind,'csv_rows':len(rows),'matched_rows':len(rows),'additional_markdown_pages':sum((b-a).values()),'status':'passed'})
 for p in pages.values():
  for ids in p['refs'].values():
   if any(i not in pages for i in ids):raise ValueError('Missing linked source page: '+p['id'])
 return pages,checks,inventory

class Importer:
 def __init__(self, pages,checks,source,sha):
  self.P=pages;self.checks=checks;self.source=source;self.sha=sha
  self.now=dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')
  self.tables={k:[] for k in ['companies','batches','trainees','daily_attendance','attendance_10day','assessments']}
  self.ledger={p['id']:{'disposition':'pending','reason':'','app_records':[],'batch_id':None} for p in pages.values()}
  self.reviews=[];self.bmap={};self.tmap={};self.comap={};self.name_index=collections.defaultdict(list);self.derived={}
  self.reverse=collections.defaultdict(lambda:collections.defaultdict(set))
  for r in pages.values():
   for ids in r['refs'].values():
    for i in ids:self.reverse[i][r['kind']].add(r['id'])
 def refs(self,r,kind):return sorted(set(i for ids in r['refs'].values() for i in ids if self.P[i]['kind']==kind))
 def group(self,kind):return [r for r in self.P.values() if r['kind']==kind]
 def record(self,source,**fields):
  return {'id':uid(source['id']),'source_id':source['id'],'source_meta':{'origin':'notion','source_title':source['source_title'],'flags':[]},'version':1,'created_at':self.now,'updated_at':self.now,**fields}
 def map(self,src,table,row,reason='Imported from the original Notion page.'):
  ent=self.ledger[src['id']];ent.update(disposition='imported',reason=reason,batch_id=row.get('batch_id') or (row['id'] if table=='batches' else None));ent['app_records'].append({'table':table,'id':row['id']})
 def omit(self,src,why,disposition='excluded_empty'):
  self.ledger[src['id']].update(disposition=disposition,reason=why)
 def review(self,code,row,srcs,message,table=None,status='open'):
  ids=sorted(set(s['id'] if isinstance(s,dict) else s for s in srcs))
  key=code+':'+':'.join(ids)
  self.reviews.append({'id':uid(key),'code':code,'batch_id':row.get('batch_id') or (row.get('id') if table=='batches' else None),'entity':table,'entity_id':row.get('id'),'source_ids':ids,'message':message,'status':status,'resolution':'','updated_at':self.now})
  if 'source_meta' in row:row['source_meta']['flags'].append({'code':code,'message':message})
 def company(self,name):
  name=clean(name or '')
  if not name:return None
  key=norm(name)
  if key not in self.comap:
   c={'id':uid('company:'+key),'name':name,'source_id':None,'source_meta':{'origin':'notion','basis':'Company field in imported records'},'version':1,'created_at':self.now,'updated_at':self.now}
   self.tables['companies'].append(c);self.comap[key]=c['id']
  return self.comap[key]
 def base_batch(self,r):
  bs=set(self.refs(r,'batches'))|self.reverse[r['id']]['batches']
  bs={self.bmap[b] for b in bs if b in self.bmap}
  if len(bs)>1:raise ValueError('Multiple incompatible batch relations: '+r['id'])
  return next(iter(bs),None)
 def make_trainee(self,key,name,bid,cid,source_id=None,meta=None):
  t={'id':uid(key),'trainee_name':clean(name),'company_id':cid,'batch_id':bid,'email':'','phone':'','job_title':'','notes':'','source_id':source_id,'source_meta':{'origin':'notion','flags':[],**(meta or {})},'version':1,'created_at':self.now,'updated_at':self.now}
  self.tables['trainees'].append(t);self.name_index[(bid,norm(name))].append(t);return t
 def exclude_examples(self):
  for r in self.P.values():
   # Explicit example labels only; TEMP records are preserved, not assumed demo.
   if re.search(r'\bExample\b',r['title'],re.I) or 'Example assessment' in r['props'].get('Instructor Comment',''):
    self.omit(r,'Explicitly labelled example/template in the source; excluded from operational data.','excluded_demo')
 def build_batches(self):
  grouped=collections.defaultdict(list)
  for r in self.group('batches'):
   m=re.fullmatch(r'batch\s+(\d+)',r['title'],re.I)
   if not m:self.omit(r,'Blank/untitled batch shell.');continue
   grouped[int(m[1])].append(r)
  for n,rs in sorted(grouped.items()):
   real_refs=set()
   for r in rs:
    for rr in self.P.values():
     if r['id'] in self.refs(rr,'batches') and self.ledger[rr['id']]['disposition']!='excluded_demo':
      if rr['kind']=='trainees' or any(k in rr['props'] for k in ['Status','Mapping','Product Knowledge','Trainee','Trainee 1']):real_refs.add(rr['id'])
   if n>=44 and not real_refs:
    for r in rs:self.omit(r,'Empty demonstration batch, excluded as requested.','excluded_demo')
    continue
   canonical=max(rs,key=lambda r:sum(len(ids) for ids in r['refs'].values()))
   bid=uid(canonical['id'])
   for r in rs:self.bmap[r['id']]=bid
   p=canonical['props'];rng=p.get('Date Range');start=end=None
   if rng:
    ds=rng.split('\u2192');start=date(ds[0].strip());end=date(ds[-1].strip())
   b=self.record(canonical,batch_name=f'Batch {n}',status=p.get('Status') or None,start_date=start,end_date=end,session_dates=[],capacity=None,description='')
   b['source_meta'].update(date_basis='source' if rng else 'not_recorded',source_batch_ids=[r['id'] for r in rs])
   self.tables['batches'].append(b);self.map(canonical,'batches',b)
   for r in rs:
    if r['id']!=canonical['id']:
     self.map(r,'batches',b,'Empty duplicate of the same numbered batch, consolidated without duplicating the roster.');self.ledger[r['id']]['disposition']='consolidated'
  for r in self.P.values():
   self.ledger[r['id']]['batch_id']=self.base_batch(r) or self.ledger[r['id']]['batch_id']
 def build_trainees(self):
  orphan=[]
  for r in self.group('trainees'):
   bid=self.base_batch(r)
   if not bid:orphan.append(r);continue
   t=self.make_trainee(r['id'],r['title'],bid,self.company(r['props'].get('Company')),r['id'],{'source_title':r['source_title'],'membership_basis':'trainee_master'})
   self.tmap[r['id']]=t;self.map(r,'trainees',t)
  for r in orphan:
   linked=[self.P[i] for i in self.refs(r,'assessments')];bids={self.base_batch(x) for x in linked}-{None}
   bid=next(iter(bids)) if len(bids)==1 else None
   candidates=self.name_index[(bid,norm(r['title']))] if bid else []
   if len(candidates)==1 and not r['props'].get('Company'):
    t=candidates[0];t['source_meta'].setdefault('alias_source_ids',[]).append(r['id']);self.tmap[r['id']]=t;self.map(r,'trainees',t,'Orphan duplicate linked to an assessment in the same batch as a unique exact-name master trainee.');self.ledger[r['id']]['disposition']='consolidated'
   else:
    t=self.make_trainee(r['id'],r['title'],bid,self.company(r['props'].get('Company')),r['id'],{'membership_basis':'assessment_relation' if bid else 'unassigned_master'})
    self.tmap[r['id']]=t;self.map(r,'trainees',t)
 def named_person(self,r,bid):
  if r['kind']=='daily':m=re.match(r'^\d{4}-\d{2}-\d{2}\s*-\s*(.+)$',r['title'])
  else:m=re.match(r'^(.+?)\s*-\s*Batch\s+\d+\s*\(',r['title'],re.I)
  return clean(m[1]) if m else None
 def resolve_trainee(self,r,bid):
  tids=set(self.refs(r,'trainees'))|self.reverse[r['id']]['trainees']
  ts=list({self.tmap[i]['id']:self.tmap[i] for i in tids if i in self.tmap}.values())
  if len(ts)>1:return None,{'link_method':'shared_source_relation','linked_trainee_ids':[t['id'] for t in ts]},'shared'
  if len(ts)==1:
   t=ts[0]
   if t['batch_id']==bid:return t,{'link_method':'notion_relation'},None
   candidates=self.name_index[(bid,norm(t['trainee_name']))]
   co=self.company(r['props'].get('Company'))
   candidates=[c for c in candidates if co is None or c['company_id'] in [co,None]]
   if len(candidates)==1 and candidates[0]['source_meta'].get('master_trainee_id')==t['id']:
    member=candidates[0];member['source_meta']['evidence_source_ids'].append(r['id'])
    return member,{'link_method':'explicit_record_batch','original_trainee_id':t['id']},'cross_batch'
   if len(candidates)==1:
    return candidates[0],{'link_method':'exact_name_in_explicit_batch','original_trainee_id':t['id']},'relinked'
   # Preserve a record's explicit batch scope without moving its master trainee.
   key='record-membership:'+t['id']+':'+str(bid)
   if key not in self.derived:
    self.derived[key]=self.make_trainee(key,t['trainee_name'],bid,t['company_id'],r['id'],{'membership_basis':'record_relation','master_trainee_id':t['id'],'master_batch_id':t['batch_id'],'evidence_source_ids':[]})
   member=self.derived[key];member['source_meta']['evidence_source_ids'].append(r['id'])
   return member,{'link_method':'explicit_record_batch','original_trainee_id':t['id']},'cross_batch'
  name=self.named_person(r,bid)
  if name:
   candidates=self.name_index[(bid,norm(name))]
   if len(candidates)==1:
    member=candidates[0]
    if member['source_meta'].get('membership_basis')=='named_record':member['source_meta']['evidence_source_ids'].append(r['id'])
    return member,{'link_method':'exact_record_title_in_batch'},'title_link'
   if len(candidates)>1:return None,{'link_method':'ambiguous_name','source_name':name,'candidate_trainee_ids':[t['id'] for t in candidates]},'unassigned'
   key='named-record:'+str(bid)+':'+norm(name)
   if key not in self.derived:
    self.derived[key]=self.make_trainee(key,name,bid,None,r['id'],{'membership_basis':'named_record','evidence_source_ids':[]})
   t=self.derived[key];t['source_meta']['evidence_source_ids'].append(r['id'])
   return t,{'link_method':'explicit_name_in_record_title'},'reconstructed'
  return None,{'link_method':'unassigned_source'},'unassigned'
 def build_records(self):
  for kind in ['daily','checklists','assessments']:
   for r in self.group(kind):
    if self.ledger[r['id']]['disposition']!='pending':continue
    p=r['props'];bid=self.base_batch(r)
    if kind=='assessments':
     useful=bool(self.refs(r,'trainees') or p.get('Assessment Outcome') or p.get('Instructor Comment') or any(k in p for k in SCORE_KEYS.values()) or p.get('Company'))
    elif kind=='daily':
     useful=bool(self.refs(r,'trainees') or self.named_person(r,bid) or any(p.get(k) for k in ['Status','Arrival Time','Departure Time','Absence Reason']))
    else:useful=True
    if not useful:
     self.omit(r,'Blank record shell: no trainee, status, assessment inputs, or operational event. Dates/auto-number/formula defaults retained only in source archive.');continue
    if not bid:
     bids={t['batch_id'] for i in self.refs(r,'trainees') if (t:=self.tmap.get(i)) and t['batch_id']}
     if len(bids)==1:bid=next(iter(bids))
    t,meta,issue=self.resolve_trainee(r,bid);row=self.record(r,trainee_id=t['id'] if t else None,batch_id=bid);row['source_meta'].update(meta)
    if kind=='daily':
     row.update(date=date(p.get('Date')),arrival_time=timestamp(p.get('Arrival Time')),departure_time=timestamp(p.get('Departure Time')),status=p.get('Status') or None,is_late=p.get('Is Late?')=='Yes',absence_reason=p.get('Absence Reason',''),analytics_included=True)
     row['source_meta'].update(entry_id=p.get('Entry ID'),reported_minutes_late=number(p.get('Minutes Late')),reported_was_late=p.get('Was Late?')=='Yes')
     # Keep questionable timestamps exactly as supplied, while clearly flagging them.
     flags=[]
     for field,key in [('arrival_time','Arrival Time'),('departure_time','Departure Time')]:
      if p.get(key) and row[field] is None:flags.append(key+' contains a date only, not a recorded time.')
     if row['departure_time'] and (not row['arrival_time'] or row['departure_time']<row['arrival_time']):flags.append('Departure precedes arrival or arrival was not supplied.')
     if row['arrival_time'] and row['date'] and dt.datetime.fromisoformat(row['arrival_time'].replace('Z','+00:00')).astimezone(ZoneInfo('Africa/Cairo')).date().isoformat()!=row['date']:flags.append('Arrival timestamp date differs from the attendance Date field.')
     if row['status'] in ['Absent','Off Day'] and (row['arrival_time'] or row['departure_time'] or row['is_late']):flags.append('The source contains a time or late flag alongside an absent/off-day status.')
     if flags:self.review('source_time_conflict',row,[r],' '.join(flags)+' Original values retained.',TABLE[kind])
    elif kind=='checklists':
     row.update(period_start=date(p.get('Period Start')),period_end=date(p.get('Period End')),days=[p.get(f'Day {i}')=='Yes' for i in range(1,11)],report=p.get('Attendance AI Report',''),report_kind='notion')
     row['source_meta'].update(recorded_checklist_status=p.get('Checklist Status'),recorded_completion=p.get('Completion %'),linked_daily_source_ids=self.refs(r,'daily'),recorded_rollups={k:p.get(k) for k in ['Present (10 days)','Absent (10 days)','Late (10 days)']})
    else:
     vals={k:number(p.get(v)) for k,v in SCORE_KEYS.items()}
     if any(v is not None and not 0<=v<=5 for v in vals.values()):raise ValueError('Skill outside 0-5: '+r['id'])
     comment=p.get('Instructor Comment','');not_assessed=bool(re.match(r'^\s*not\s+assess?ed\s*[.!]?\s*$',comment,re.I))
     row.update(**vals,assessment_title=r['title'] or 'Untitled assessment',assessment_outcome=p.get('Assessment Outcome') or None,instructor_comment=comment,report=p.get('Assessment AI Report',''),report_kind='notion',recorded_attendance=number(p.get('Attendance ')),recorded_absence=number(p.get('Absence ')),company_id=self.company(p.get('Company')),analytics_included=all(v is not None for v in vals.values()) and not not_assessed and t is not None)
     row['source_meta'].update(recorded_percentages={k:p.get(k) for k in ['Tech Score %','Soft Score %','Overall %']},assessment_state='shared' if issue=='shared' else 'not_assessed' if not_assessed else 'draft' if any(v is None for v in vals.values()) else 'recorded')
    self.tables[TABLE[kind]].append(row);self.map(r,TABLE[kind],row)
    if issue=='shared':self.review('shared_assessment',row,[r],'One source assessment is linked to multiple trainees. Kept as a single shared source record; its scores are not copied to individuals or included in performance averages.',TABLE[kind])
    elif issue=='unassigned':self.review('unassigned_record',row,[r],'This source record has no unambiguous trainee identity. Retained in its batch without inventing or guessing a person.',TABLE[kind])
    elif issue=='relinked':self.review('source_link_reconciled',row,[r],'The source person link points to another batch. Matched the unique exact-name trainee in the explicitly recorded batch; the assessment company agrees where supplied. Original relationship preserved in the source archive.',TABLE[kind],status='resolved')
 def finalize(self):
  # Source-named/relation-backed enrollments are independently traceable; no fictitious contact/company values.
  for t in self.derived.values():
   evidence=t['source_meta']['evidence_source_ids']
   for i in evidence:
    app=self.ledger[i]['app_records'];ref={'table':'trainees','id':t['id']}
    if ref not in app:app.append(ref)
   if t['source_meta']['membership_basis']=='record_relation':self.review('cross_batch_membership',t,evidence,'Source attendance names this batch, while the same person\'s master record names another batch. Kept a record-linked roster entry here without moving or merging the original master record.','trainees')
  # Attendance: exact duplicate event records are preserved but counted only once.
  groups=collections.defaultdict(list)
  for d in self.tables['daily_attendance']:
   if d['trainee_id'] and d['date']:groups[(d['trainee_id'],d['date'])].append(d)
  for rows in groups.values():
   if len(rows)<2:continue
   keys=['status','arrival_time','departure_time','is_late','absence_reason']
   sig=lambda x:tuple(x[k] for k in keys)
   if len({sig(r) for r in rows})==1:
    for r in sorted(rows,key=lambda r:r['id'])[1:]:r['analytics_included']=False;r['source_meta']['duplicate_of']=sorted(rows,key=lambda r:r['id'])[0]['id']
   else:
    # Never resolve competing values merely from row order.
    for r in rows:r['analytics_included']=False;r['source_meta']['duplicate_conflict']=True
    self.review('competing_attendance',rows[0],[r['source_id'] for r in rows],'Several source records have different values for the same trainee and date. All originals retained; excluded from totals until an administrator selects the applicable record.','daily_attendance')
  ag=collections.defaultdict(list)
  for a in self.tables['assessments']:
   if a['trainee_id'] and a['analytics_included']:ag[(a['trainee_id'],a['batch_id'])].append(a)
  for rows in ag.values():
   if len(rows)<2:continue
   signature=lambda a:tuple(a[k] for k in [*SCORE_KEYS,'assessment_outcome','recorded_attendance','recorded_absence'])
   if len({signature(a) for a in rows})==1:
    base=min(rows,key=lambda a:('(' in a['assessment_title'],a['id']))
    for a in rows:
     if a is not base:a['analytics_included']=False;a['source_meta'].update(assessment_state='duplicate',duplicate_of=base['id'])
   else:
    for a in rows:a['analytics_included']=False;a['source_meta']['assessment_state']='multiple_results'
    self.review('competing_assessments',rows[0],[r['source_id'] for r in rows],'Multiple differing assessed results exist for this enrollment. Kept every result; no unsupported latest-result assumption. Choose an analytical result after reviewing the originals.','assessments')
  for b in self.tables['batches']:
   entries=[r for r in self.tables['daily_attendance'] if r['batch_id']==b['id']];dates=sorted({r['date'] for r in entries if r['date']})
   b['session_dates']=dates
   if not b['start_date'] and dates:
    b['start_date']=dates[0];b['end_date']=dates[-1];b['source_meta']['date_basis']='observed_attendance'
   elif not b['start_date']:
    periods={(r['period_start'],r['period_end']) for r in self.tables['attendance_10day'] if r['batch_id']==b['id']}
    if len(periods)==1:
     start,end=next(iter(periods));b['start_date']=start;b['end_date']=end;b['source_meta']['date_basis']='checklist_period'
   if b['start_date'] and dates and (dates[0]<b['start_date'] or dates[-1]>b['end_date']):
    # Do not stretch the original range to fit inconsistent exported records.
    b['source_meta']['out_of_range_dates']=[d for d in dates if d<b['start_date'] or d>b['end_date']]
   periods=sorted({(r['period_start'],r['period_end']) for r in self.tables['attendance_10day'] if r['batch_id']==b['id']})
   if len(periods)>1:self.review('multiple_checklist_periods',b,[r['source_id'] for r in self.tables['attendance_10day'] if r['batch_id']==b['id']],'The source contains more than one checklist period for this batch. Every period is retained separately; they are not added together as duplicate attendance.', 'batches')
  if any(v['disposition']=='pending' for v in self.ledger.values()):raise ValueError('Unaccounted source record')
  # De-duplicate identical review identifiers without losing source evidence.
  self.reviews=list({r['id']:r for r in self.reviews}.values())
 def summary(self):
  batches=[]
  for b in self.tables['batches']:
   ts=[t for t in self.tables['trainees'] if t['batch_id']==b['id']];ds=[r for r in self.tables['daily_attendance'] if r['batch_id']==b['id']];ass=[r for r in self.tables['assessments'] if r['batch_id']==b['id']];cs=[r for r in self.tables['attendance_10day'] if r['batch_id']==b['id']]
   batches.append({'id':b['id'],'batch':b['batch_name'],'status':b['status'],'date_basis':b['source_meta']['date_basis'],'start_date':b['start_date'],'end_date':b['end_date'],'roster_entries':len(ts),'master_roster_entries':sum(t['source_meta'].get('membership_basis')=='trainee_master' for t in ts),'named_record_roster_entries':sum(t['source_meta'].get('membership_basis')=='named_record' for t in ts),'cross_batch_roster_entries':sum(t['source_meta'].get('membership_basis')=='record_relation' for t in ts),'daily_records':len(ds),'daily_unassigned':sum(not d['trainee_id'] for d in ds),'daily_status_not_recorded':sum(d['status'] is None for d in ds),'checklist_records':len(cs),'assessment_records':len(ass),'analytical_assessments':sum(a['analytics_included'] for a in ass),'missing_attendance_is_expected':not bool(ds),'missing_assessments_is_expected':not bool(ass)})
  return {'version':'3.0.0','source_name':self.source,'source_sha256':self.sha,'imported_at':self.now,'source_record_counts':dict(collections.Counter(r['kind'] for r in self.P.values())), 'imported_counts':{k:len(v) for k,v in self.tables.items()},'source_dispositions':dict(collections.Counter(v['disposition'] for v in self.ledger.values())), 'csv_reconciliation':self.checks,'excluded_batch_numbers':[int(re.search(r'\d+',r['title'])[0]) for r in self.group('batches') if re.search(r'\d+',r['title']) and self.ledger[r['id']]['disposition']=='excluded_demo'], 'batch_numbers_not_in_export':[n for n in range(1,44) if not any(b['batch_name']==f'Batch {n}' for b in self.tables['batches'])],'batches':batches,'review_counts':dict(collections.Counter(r['code'] for r in self.reviews)),'total_open_reviews':sum(r['status']=='open' for r in self.reviews),'source_coverage':'Every academy Markdown page has an explicit destination or exclusion reason. Every academy CSV row matched its Markdown source.','policy':{'unknown_values':'NULL, not fabricated zeroes or dates','outcomes':'Source outcomes preserved, not recalculated or auto-overwritten','timezones':'Explicit source GMT offset converted to UTC; original value retained','authentication':'No accounts, credentials, invitations, or sessions imported','private_notebooks':'Not imported','attendance_scope':'Explicit attendance batch preserved even when trainee master names a different batch','name_matching':'Only unique exact normalized names within an explicit batch; no fuzzy matching','missing_records':'Expected gaps, not migration failures'}}
 def write(self,destination:Path,schema:Path,report:Path):
  if destination.exists():
   existing=sqlite3.connect(destination)
   try: row=existing.execute('SELECT source_sha256 FROM import_runs').fetchone()
   except sqlite3.Error:row=None
   finally:existing.close()
   if row and row[0]==self.sha:print('This export is already imported. Existing database left unchanged.');return
   raise FileExistsError('Destination exists. Use a new path; live databases are never overwritten.')
  destination.parent.mkdir(parents=True,exist_ok=True)
  db=sqlite3.connect(destination);db.executescript(schema.read_text());db.execute('BEGIN IMMEDIATE')
  enc=lambda v:json.dumps(v,ensure_ascii=False,separators=(',',':')) if isinstance(v,(dict,list)) else int(v) if isinstance(v,bool) else v
  def insert(table,row):db.execute(f'INSERT INTO {table} ({",".join(row)}) VALUES ({",".join("?" for _ in row)})',[enc(v) for v in row.values()])
  try:
   for table,rows in self.tables.items():
    for row in rows:insert(table,row)
   summary=self.summary();run=uid('import:'+self.sha)
   insert('import_runs',{'id':run,'source_name':self.source,'source_sha256':self.sha,'imported_at':self.now,'summary':summary})
   for source in self.P.values():
    state=self.ledger[source['id']]
    insert('source_records',{'id':source['id'],'import_id':run,'kind':source['kind'],'title':source['title'],'path':source['path'],'sha256':source['sha256'],'raw':source['raw'],'properties':source['props'],'relations':source['refs'],**state})
   for row in self.reviews:insert('import_reviews',row)
   insert('audit_log',{'id':uid('audit:'+self.sha),'actor':'Notion migration','action':'import','entity':'workspace','entity_id':run,'details':f'Imported {len(self.tables["batches"])} real batches from the supplied Notion export. Original academy pages and reconciliation retained.','created_at':self.now})
   fk=db.execute('PRAGMA foreign_key_check').fetchall()
   if fk:raise ValueError('Foreign key errors: '+str(fk[:5]))
   assert db.execute('SELECT COUNT(*) FROM users').fetchone()[0]==0
   assert db.execute('SELECT COUNT(*) FROM source_records').fetchone()[0]==len(self.P)
   db.commit();result=db.execute('PRAGMA integrity_check').fetchone()[0]
   if result!='ok':raise ValueError('Database integrity check: '+result)
   db.execute('PRAGMA wal_checkpoint(TRUNCATE)');db.close();destination.chmod(0o600)
   report.parent.mkdir(parents=True,exist_ok=True);report.write_text(json.dumps(summary,ensure_ascii=False,indent=2))
   print(json.dumps({'imported_counts':summary['imported_counts'],'source_dispositions':summary['source_dispositions'],'review_counts':summary['review_counts'],'database_integrity':result},indent=2))
  except Exception:
   db.rollback();db.close();destination.unlink(missing_ok=True)
   for suffix in ['-wal','-shm']:Path(str(destination)+suffix).unlink(missing_ok=True)
   raise

def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('export',type=Path,help='Original Notion ZIP archive')
 parser.add_argument('--database',type=Path,default=Path('data/red-academy.db'))
 parser.add_argument('--report',type=Path,default=Path('data/notion-reconciliation.json'))
 args=parser.parse_args();sha=hashlib.sha256(args.export.read_bytes()).hexdigest()
 P,checks,inventory=parse_export(args.export);job=Importer(P,checks,args.export.name,sha)
 job.exclude_examples();job.build_batches();job.build_trainees();job.build_records();job.finalize()
 job.write(args.database,Path(__file__).resolve().parents[1]/'server/schema.sql',args.report)
if __name__=='__main__':main()
