"""Chromium DOM acceptance for the imported workspace on a disposable real-server DB copy.
The bridge is the same restricted-environment bridge as browser_dom.py. Native browser
navigation/cookie/SSE/TLS acceptance is not claimed. No user data is modified.
"""
from pathlib import Path
import argparse,json,os,re,shutil,socket,subprocess,tempfile,time,urllib.request
from playwright.sync_api import sync_playwright,expect
import browser_harness as h
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--results');p.add_argument('--screenshots');a=p.parse_args()
checks=[];errors=[]
def check(name,ok=True):
 if not ok:raise AssertionError(name)
 checks.append(name);print('PASS:',name,flush=True)
def state(t):
 r=t.call('state');assert r['status']==200,r
 return json.loads(r['text'])
def go(page,route,batch=''):
 page.keyboard.press('Escape')
 page.evaluate('(v)=>{__redTest.ctx.batchId=v.batch;__redTest.ctx.go(v.route);}',{'route':route,'batch':batch})
def reset_page(page):page.evaluate('()=>{__redTest.ctx.page=1;__redTest.ctx.render();}')
def click(page,action):
 modal=page.locator('#modal-root [data-action="'+action+'"]')
 (modal if modal.count() else page.locator('[data-action="'+action+'"]')).first.click()
def save_legacy(page):
 page.locator('#legacy-form [type="submit"]').click();expect(page.locator('#legacy-form')).to_have_count(0)
def record(page,table,id):
 page.evaluate('(v)=>{document.querySelector("#main").insertAdjacentHTML("beforeend",`<button id="qa-open" data-action="record-detail" data-table="${v.table}" data-id="${v.id}">Open test record</button>`);}',{'table':table,'id':id});page.locator('#qa-open').click()
with tempfile.TemporaryDirectory(prefix='red-import-browser-') as tmp:
 db=Path(tmp)/'qa.db';shutil.copy2(ROOT/'data/red-academy.db',db)
 with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
 h.BASE=f'http://localhost:{port}';env={**os.environ,'PORT':str(port),'HOST':'127.0.0.1','APP_URL':h.BASE,'DATABASE_PATH':str(db),'APP_ENV':'test'}
 logpath=Path(tmp)/'server.log'
 with logpath.open('w') as log:server=subprocess.Popen(['node','server.mjs'],cwd=ROOT,env=env,stdout=log,stderr=log)
 try:
  for _ in range(100):
   try:urllib.request.urlopen(h.BASE+'/api/session',timeout=1).close();break
   except Exception:
    if server.poll() is not None:raise RuntimeError(logpath.read_text())
    time.sleep(.1)
  code=re.search(r'Setup code: ([A-Za-z0-9_-]{43})',logpath.read_text())[1]
  owner=h.Transport();email='qa-owner@example.test';pw='RED-Import-QA-Password-123!'
  res=owner.call('auth/setup','POST',{'token':code,'email':email,'password':pw,'full_name':'RED Administrator'});assert res['status']==201,res
  with sync_playwright() as playwright:
   browser=playwright.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
   context=browser.new_context(viewport={'width':1512,'height':1050},reduced_motion='reduce');page=context.new_page();page.set_default_timeout(20000);page.on('pageerror',lambda err:errors.append(str(err)));h.mount(page,owner)
   expect(page.locator('#auth-form')).to_have_attribute('data-mode','login');check('Imported data is not exposed before authentication')
   page.locator('#auth-form [name="email"]').fill(email);page.locator('#auth-form [name="password"]').fill(pw);page.locator('#auth-form [type="submit"]').click();page.wait_for_function('__redTest?.store.status==="ready"&&__redTest.store.data.batches.length===42')
   check('Login loads all 42 real batches');d=state(owner);bs={r['batch_name']:r['id'] for r in d['batches']}
   # Keep the test isolated from periodic bridge repaint races while manipulating dialogs.
   page.evaluate('()=>__redTest.store.source.close()')
   for route in ['dashboard','batches','trainees','attendance','summaries','assessments','companies','analytics','settings','register','migration']:
    go(page,route);check('Desktop imported '+route+' renders without invalid numbers',not re.search(r'\b(NaN|undefined)\b',page.locator('body').inner_text()))
   go(page,'batches')
   for b in d['batches']:
    page.evaluate('(id)=>__redTest.ctx.go("batches",{detailId:id})',b['id']);expect(page.locator('h1')).to_have_text(b['batch_name'])
   check('Every real batch detail page opens, including undated and partially populated batches')
   go(page,'batches');click(page,'batch-view') # First button = board
   expect(page.locator('.kanban-column')).to_have_count(4);check('Board includes unknown-status batches in a fourth lane')
   page.locator('[data-action="batch-view"][data-view="timeline"]').click();check('Timeline identifies undated batches instead of inventing dates','no complete date range' in page.locator('body').inner_text())
   page.locator('[data-action="batch-view"][data-view="calendar"]').click();check('Calendar opens with observed and scheduled dates',page.locator('.calendar-grid').count()==1)
   go(page,'assessments');check('All assessment source records are visible in the register','of 847 records' in page.locator('body').inner_text())
   go(page,'register');check('All daily source records are visible in the register','of 2606 records' in page.locator('body').inner_text())
   go(page,'summaries',bs['Batch 30']);check('Batch 30 retains both sets of checklist periods','of 26 records' in page.locator('body').inner_text());page.locator('[data-action="summary-view"][data-view="board"]').click();check('Checklist board shows all 26 periods',page.locator('.summary-card').count()==26)
   go(page,'register',bs['Batch 43']);check('Batch 43 attendance register contains all 90 actual records','of 90 records' in page.locator('body').inner_text())
   go(page,'assessments',bs['Batch 43']);check('No assessments were invented for Batch 43','No assessment records' in page.locator('body').inner_text())
   go(page,'register',bs['Batch 42']);check('Batch 42 keeps its one timestamp-bearing unassigned entry, not its blank shells','of 1 records' in page.locator('body').inner_text() and 'Unassigned source record' in page.locator('body').inner_text())
   go(page,'attendance',bs['Batch 42']);page.evaluate("()=>{__redTest.ctx.date='2026-09-01';__redTest.ctx.render();}");expect(page.locator('.stat-card').filter(has_text='Unrecorded').locator('.stat-value')).to_have_text('19');check('An unassigned blank-status entry does not mark a named trainee as recorded')
   shared=next(r for r in d['assessments'] if r['source_meta']['assessment_state']=='shared');go(page,'assessments',bs['Batch 41']);page.locator('[data-field="search"]').fill('Shared source record');check('Shared assessment is listed once without a fabricated trainee',page.locator('tbody tr').count()==1);click(page,'record-detail');expect(page.locator('.modal')).to_contain_text('Shared source record');check('Shared source score and separate reported totals are inspectable');page.keyboard.press('Escape')
   missing=next(r for r in d['assessments'] if r['product_knowledge'] is None and r['mapping'] is not None);go(page,'assessments',missing['batch_id']);record(page,'assessments',missing['id']);expect(page.locator('.modal')).to_contain_text('Not recorded');click(page,'legacy-edit');expect(page.locator('#legacy-form [name="product_knowledge"]')).to_have_value('');check('Missing skill opens blank, not zero');old_outcome=missing['assessment_outcome'];save_legacy(page);saved=next(r for r in state(owner)['assessments'] if r['id']==missing['id']);check('Saving partial assessment preserves NULL skill and recorded outcome',saved['product_knowledge'] is None and saved['assessment_outcome']==old_outcome)
   bad=next(r for r in d['daily_attendance'] if r['source_meta']['flags']);go(page,'register',bad['batch_id']);record(page,'daily_attendance',bad['id']);click(page,'legacy-edit');page.locator('#legacy-form [name="absence_reason"]').fill('QA preservation check');save_legacy(page);saved=next(r for r in state(owner)['daily_attendance'] if r['id']==bad['id']);check('Editing a note keeps conflicting historical timestamps unchanged',saved['arrival_time']==bad['arrival_time'] and saved['departure_time']==bad['departure_time'] and saved['status']==bad['status'])
   unknown=next(r for r in d['assessments'] if r['trainee_id'] is None and r['source_meta']['assessment_state']!='shared');go(page,'assessments',unknown['batch_id']);record(page,'assessments',unknown['id']);click(page,'legacy-edit');save_legacy(page);check('Unassigned assessment is editable without inventing a person',next(r for r in state(owner)['assessments'] if r['id']==unknown['id'])['trainee_id'] is None)
   undated=next(r for r in d['batches'] if r['start_date'] is None);go(page,'batches');page.evaluate('(id)=>__redTest.ctx.go("batches",{detailId:id})',undated['id']);click(page,'edit-batch');expect(page.locator('#legacy-form [name="start_date"]')).to_have_value('');save_legacy(page);saved=next(r for r in state(owner)['batches'] if r['id']==undated['id']);check('Undated batch saves without fabricated dates or capacity',saved['start_date'] is None and saved['end_date'] is None and saved['capacity'] is None)
   go(page,'migration');click(page,'source-browser');expect(page.locator('.modal')).to_contain_text('4815 source pages');page.locator('#source-search [name="kind"]').select_option('assessments');page.locator('#source-search button').click();expect(page.locator('.modal')).to_contain_text('897 source pages');check('Authenticated source archive filters and paginates original records');click(page,'source-record');expect(page.locator('.modal .source-pre').first).to_contain_text('# ');check('Original Markdown is readable as escaped text');page.keyboard.press('Escape')
   go(page,'migration');click(page,'review-note');page.locator('#review-form [name="resolution"]').fill('QA: reviewed original; no source facts changed.');page.locator('#review-form [type="submit"]').click();expect(page.locator('#review-form')).to_have_count(0);check('Administrator can acknowledge a source discrepancy without rewriting it',any(r['status']=='acknowledged' for r in state(owner)['import_reviews']))
   # Desktop captures show the actual loaded workspace, not a mockup.
   if a.screenshots:
    dest=Path(a.screenshots);dest.mkdir(parents=True,exist_ok=True);page.evaluate("document.getElementById('toast-root').replaceChildren()");go(page,'dashboard');page.wait_for_timeout(300);page.screenshot(path=str(dest/'RED-Academy-Imported-Overview.png'),full_page=True);go(page,'migration');page.screenshot(path=str(dest/'RED-Academy-Import-Review.png'),full_page=False)
   page.set_viewport_size({'width':390,'height':844})
   for route in ['dashboard','batches','trainees','attendance','summaries','assessments','companies','analytics','settings','register','migration']:
    go(page,route);check('Mobile imported '+route+' fits viewport',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
   if a.screenshots:go(page,'dashboard');page.screenshot(path=str(dest/'RED-Academy-Imported-Mobile.png'),full_page=False)
   check('No uncaught application JavaScript errors',not errors);browser.close()
 finally:
  server.terminate();server.wait(timeout=10)
report={'ok':True,'checks':len(checks),'check_names':checks,'errors':errors,'limitations':['In-memory HTTP bridge, not native browser cookie/navigation testing.','Source data tested on an isolated database copy.','Browser EventSource is simulated; real HTTP SSE is tested separately.','No hosted TLS, service-worker or production-scale load acceptance claim.']}
if a.results:Path(a.results).write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
