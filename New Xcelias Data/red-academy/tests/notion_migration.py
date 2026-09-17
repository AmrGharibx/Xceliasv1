"""Independent, field-by-field checks against the archived Notion properties.
Run on the untouched delivered database: python tests/notion_migration.py
Optional --source compares all archived page bytes with the supplied original ZIP.
This script is read-only and contains no account credentials or trainee fixtures.
"""
from pathlib import Path
import argparse, collections, datetime as dt, hashlib, json, re, sqlite3, unicodedata, zipfile
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--database',type=Path,default=ROOT/'data/red-academy.db');p.add_argument('--source',type=Path);p.add_argument('--results',type=Path);a=p.parse_args()
c=sqlite3.connect('file:'+str(a.database.resolve())+'?mode=ro',uri=True);c.row_factory=sqlite3.Row
checks=[];field_checks=0

def check(name,ok):
 if not ok:raise AssertionError(name)
 checks.append(name)

def same(got,want,context):
 global field_checks
 if got!=want:raise AssertionError(f'{context}: value mismatch')
 field_checks+=1

def clean(s):return ' '.join(unicodedata.normalize('NFC',s or '').split())
def num(s):return None if s is None or s.strip()=='' else float(s)
def source_date(s):
 if not s:return None
 v=re.match(r'([A-Za-z]+ \d{1,2}, \d{4})',s.strip())[1]
 return dt.datetime.strptime(v,'%B %d, %Y').date().isoformat()
def source_time(s):
 if not s or not re.search(r'\d:\d',s):return None
 m=re.fullmatch(r'([A-Za-z]+) (\d+), (\d+) (\d+):(\d+)(?::(\d+))? (AM|PM) \(GMT([+-]\d+)(?::(\d+))?\)',s)
 assert m, 'Unrecognized source timestamp'
 month=dt.datetime.strptime(m[1],'%B').month;h=int(m[4])%12+(12 if m[7]=='PM' else 0)
 minutes=int(m[8])*60+(-1 if m[8].startswith('-') else 1)*int(m[9] or 0)
 t=dt.datetime(int(m[3]),month,int(m[2]),h,int(m[5]),int(m[6] or 0),tzinfo=dt.timezone(dt.timedelta(minutes=minutes)))
 return t.astimezone(dt.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')

def rows(t):return [dict(r) for r in c.execute('SELECT * FROM '+t)]
source={r['id']:{**r,'properties':json.loads(r['properties']),'relations':json.loads(r['relations']),'destinations':json.loads(r['app_records'])} for r in rows('source_records')}
state={t:rows(t) for t in ['companies','batches','trainees','daily_attendance','attendance_10day','assessments']}
for table,rr in state.items():
 for r in rr:r['source_meta']=json.loads(r['source_meta'])
lookup={t:{r['id']:r for r in rr} for t,rr in state.items()}
counts={t:len(rr) for t,rr in state.items()}
check('All imported entity counts',counts=={'companies':55,'batches':42,'trainees':903,'daily_attendance':2606,'attendance_10day':264,'assessments':847})
check('Every source page has a final disposition',len(source)==4815 and all(r['disposition']!='pending' and r['reason'] for r in source.values()))
for r in source.values():
 same(hashlib.sha256(r['raw'].encode()).hexdigest(),r['sha256'],'Archived raw content hash')
 for m in r['destinations']:check_id=m['id'];assert check_id in lookup[m['table']]
 for linked in r['relations'].values():assert all(i in source for i in linked)
check('All source hashes, destination identities and original relation targets',True)
for r in state['daily_attendance']:
 s=source[r['source_id']];props=s['properties'];context='daily '+s['id']
 for key,prop in [('arrival_time','Arrival Time'),('departure_time','Departure Time')]:same(r[key],source_time(props.get(prop)),context+' '+key)
 same(r['date'],source_date(props.get('Date')),context+' date');same(r['status'],props.get('Status') or None,context+' status')
 same(bool(r['is_late']),props.get('Is Late?')=='Yes',context+' manual late');same(r['absence_reason'],props.get('Absence Reason',''),context+' absence reason')
 same(r['source_meta']['reported_minutes_late'],num(props.get('Minutes Late')),context+' reported lateness')
check('All 2606 attendance dates, times, statuses, reasons and late flags preserved',True)
for r in state['assessments']:
 s=source[r['source_id']];props=s['properties'];context='assessment '+s['id']
 for key,prop in [('mapping','Mapping'),('product_knowledge','Product Knowledge'),('presentability','Presentability'),('soft_skills','Soft Skills'),('recorded_attendance','Attendance '),('recorded_absence','Absence ')]:same(r[key],num(props.get(prop)),context+' '+key)
 for key,prop in [('assessment_outcome','Assessment Outcome'),('instructor_comment','Instructor Comment'),('report','Assessment AI Report')]:same(r[key],props.get(prop) or (None if key=='assessment_outcome' else ''),context+' '+key)
 co=lookup['companies'].get(r['company_id']);same(co['name'].casefold() if co else None,clean(props.get('Company')).casefold() or None,context+' company')
 if r['analytics_included']:assert all(r[k] is not None for k in ['mapping','product_knowledge','presentability','soft_skills']) and r['trainee_id']
check('All 847 assessment inputs, comments, reports, outcomes and reported attendance preserved',True)
for r in state['attendance_10day']:
 s=source[r['source_id']];props=s['properties'];same(json.loads(r['days']),[props.get('Day '+str(i))=='Yes' for i in range(1,11)],'Checklist days')
 same(r['period_start'],source_date(props.get('Period Start')),'Checklist start');same(r['period_end'],source_date(props.get('Period End')),'Checklist end')
 same(r['source_meta']['recorded_checklist_status'],props.get('Checklist Status'),'Checklist recorded status')
 same(r['source_meta']['recorded_rollups'],{k:props.get(k) for k in ['Present (10 days)','Absent (10 days)','Late (10 days)']},'Checklist original rollup text')
check('All 264 independent checklist periods, checkboxes and source rollups preserved',True)
for r in state['batches']:
 props=source[r['source_id']]['properties'];same(r['status'],props.get('Status') or None,'Batch status')
 rng=props.get('Date Range')
 if rng:
  parts=rng.split('\u2192');same(r['start_date'],source_date(parts[0].strip()),'Batch source start');same(r['end_date'],source_date(parts[-1].strip()),'Batch source end')
 else:assert r['source_meta']['date_basis'] in ['not_recorded','observed_attendance','checklist_period']
 same(r['capacity'],None,'Unknown batch capacity');same(json.loads(r['session_dates']),sorted(set(d['date'] for d in state['daily_attendance'] if d['batch_id']==r['id'] and d['date'])),'Observed attendance calendar')
check('All batch statuses, supplied ranges and observed calendars preserved',True)
for table in ['daily_attendance','attendance_10day','assessments']:
 for r in state[table]:
  if r['trainee_id']:same(lookup['trainees'][r['trainee_id']]['batch_id'],r['batch_id'],'Child enrollment batch')
check('Every assigned child record belongs to its explicit batch enrollment',True)
by_number={int(r['batch_name'].split()[-1]):r for r in state['batches']}
check('Batch 25 absent, demo batch numbers 44-57 excluded',set(by_number)==set(range(1,44))-{25})
for r in state['trainees']:
 same(r['email'],'','Unknown email');same(r['phone'],'','Unknown phone');meta=r['source_meta']
 if meta.get('membership_basis')=='trainee_master':same(r['trainee_name'],clean(source[r['source_id']]['title']),'Master name')
 if meta.get('membership_basis')=='named_record':
  same(r['company_id'],None,'Unknown company on reconstructed source name')
  assert all(r['trainee_name'] in clean(source[s]['title']) for s in meta['evidence_source_ids'])
 if meta.get('membership_basis')=='record_relation':
  same(r['batch_id'],by_number[43]['id'],'Cross-batch attendance scope');assert meta['master_batch_id'] in [by_number[42]['id'],by_number[38]['id']]
  same(len(meta['evidence_source_ids']),5,'Five source days per cross-batch membership')
check('Reconstructed and cross-batch enrollments have explicit source evidence and no fabricated contacts',True)
check('872 masters + 13 named record profiles + 18 record-linked enrollments',collections.Counter(r['source_meta']['membership_basis'] for r in state['trainees'])=={'trainee_master':872,'named_record':13,'record_relation':18})
check('Cross-batch links retain 17 Batch 42 and one Batch 38 original masters',collections.Counter(t['source_meta'].get('master_batch_id') for t in state['trainees'] if t['source_meta']['membership_basis']=='record_relation')=={by_number[42]['id']:17,by_number[38]['id']:1})
check('90 real Batch 43 attendance entries, no copied scores/checklists',sum(r['batch_id']==by_number[43]['id'] for r in state['daily_attendance'])==90 and not any(r['batch_id']==by_number[43]['id'] for t in ['assessments','attendance_10day'] for r in state[t]))
check('26 Batch 30 checklist periods remain separate',sum(r['batch_id']==by_number[30]['id'] for r in state['attendance_10day'])==26)
shared=[r for r in state['assessments'] if r['source_meta']['assessment_state']=='shared']
check('Shared Batch 41 assessment is one row, not 23 invented personal scores',len(shared)==1 and not shared[0]['trainee_id'] and not shared[0]['analytics_included'] and len(shared[0]['source_meta']['linked_trainee_ids'])==23)
check('Unassigned daily and assessment records retained',sum(not r['trainee_id'] for r in state['daily_attendance'])==16 and sum(not r['trainee_id'] for r in state['assessments'])==3)
check('Expected reviewed source-link corrections',c.execute("SELECT count(*) FROM import_reviews WHERE code='source_link_reconciled'").fetchone()[0]==21)
check('Expected original timestamp review notes',c.execute("SELECT count(*) FROM import_reviews WHERE code='source_time_conflict'").fetchone()[0]==94)
check('Database is valid and account-free',c.execute('PRAGMA integrity_check').fetchone()[0]=='ok' and not c.execute('PRAGMA foreign_key_check').fetchall() and c.execute('SELECT count(*) FROM users').fetchone()[0]==0)
if a.source:
 with zipfile.ZipFile(a.source) as z:
  for r in source.values():same(z.read(r['path']).decode('utf-8-sig'),r['raw'],'Original ZIP content')
 check('Original ZIP bytes match every archived academy page',True)
report={'ok':True,'checks':len(checks),'field_assertions':field_checks,'check_names':checks,'counts':counts}
print(json.dumps(report,indent=2));
if a.results:a.results.write_text(json.dumps(report,indent=2))
c.close()
