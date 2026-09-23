"""Optional Chromium DOM integration checks. Uses an isolated real HTTP server and
an in-memory fetch bridge. Does NOT test native browser cookies, navigation, SSE,
service workers, or downloads. No browser security policies are changed.
Requires Python 3, playwright, and a Chromium executable (CHROMIUM_PATH).
Run from project root: python tests/browser_dom.py --results /tmp/results.json
"""
from pathlib import Path
import argparse, json, os, re, socket, subprocess, tempfile, time, urllib.request
from playwright.sync_api import sync_playwright, expect
import browser_harness as h

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--results')
parser.add_argument('--screenshots')
args = parser.parse_args()
checks, errors = [], []
def check(name, condition=True):
    if not condition:
        raise AssertionError(name)
    checks.append(name)
    print("PASS:",name,flush=True)

def ready(page):
    page.wait_for_function("window.__redTest?.store.status==='ready'")

def login(page, email, password):
    page.locator('#auth-form [name="email"]').fill(email)
    page.locator('#auth-form [name="password"]').fill(password)
    page.locator('#auth-form [type="submit"]').click()
    ready(page)

def go(page, route):
    page.evaluate('(route)=>__redTest.ctx.go(route)', route)

def click(page, action):
    page.locator('[data-action="'+action+'"]').first.click()

def save(page):
    page.locator('#entity-form [type="submit"]').click()
    expect(page.locator('#entity-form')).to_have_count(0)

def state(transport):
    response=transport.call('state')
    assert response['status']==200, response
    return json.loads(response['text'])

with tempfile.TemporaryDirectory(prefix='red-private-browser-') as temporary:
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0)); port=sock.getsockname()[1]
    h.BASE=f'http://127.0.0.1:{port}'
    env={**os.environ,'PORT':str(port),'HOST':'127.0.0.1','APP_URL':h.BASE,
         'DATABASE_PATH':str(Path(temporary)/'qa.db'),'APP_ENV':'test','DATABASE_MODE':'sqlite'}
    log_path=Path(temporary)/'server.log'
    with log_path.open('w') as log:
        server=subprocess.Popen(['node','server.mjs'],cwd=ROOT,env=env,stdout=log,stderr=log)
    try:
        for attempt in range(100):
            try:
                urllib.request.urlopen(h.BASE+'/api/session',timeout=1).close(); break
            except Exception:
                if server.poll() is not None: raise RuntimeError(log_path.read_text())
                time.sleep(.1)
        code=re.search(r'Setup code: ([A-Za-z0-9_-]{43})',log_path.read_text()).group(1)
        with sync_playwright() as playwright:
            launch_args={'headless':True,'args':['--no-sandbox']}
            if os.environ.get('CHROMIUM_PATH'): launch_args['executable_path']=os.environ['CHROMIUM_PATH']
            browser=playwright.chromium.launch(**launch_args)
            context=browser.new_context(viewport={'width':1440,'height':1050},reduced_motion='reduce')
            page=context.new_page(); page.set_default_timeout(15000); page.on('pageerror', lambda error: errors.append(str(error)))
            owner=h.Transport(); h.mount(page,owner)
            expect(page.locator('#auth-form')).to_have_attribute('data-mode','setup')
            check('Fresh server shows first-owner setup, not a dashboard or sample data')
            page.locator('[name="token"]').fill(code)
            page.locator('[name="full_name"]').fill('RED Administrator')
            page.locator('[name="email"]').fill('owner@example.test')
            password='Isolated-QA-Password-123!'
            page.locator('[name="password"]').fill(password)
            page.locator('[name="confirm_password"]').fill(password)
            page.locator('#auth-form [type="submit"]').click()
            expect(page.locator('#auth-form')).to_have_attribute('data-mode','login')
            check('One-time setup creates chosen owner and returns to sign-in')
            login(page,'owner@example.test',password)
            go(page,'dashboard')
            check('Dark mode renders the ambient star field',page.locator('canvas.starfield').count()==1 and page.evaluate('getComputedStyle(document.querySelector("canvas.starfield")).display!="none"'))
            click(page,'theme')
            check('Light mode keeps the academy mark legible and uses its own star treatment',page.evaluate('document.body.classList.contains("light") && getComputedStyle(document.querySelector(".brand-mark")).webkitMaskImage.includes("training-academy-logo") && getComputedStyle(document.querySelector("canvas.starfield")).mixBlendMode==="multiply"'))
            if args.screenshots:
                dest=Path(args.screenshots); dest.mkdir(parents=True,exist_ok=True)
                page.screenshot(path=str(dest/'RED-Academy-Light-Mode.png'),full_page=True)
            click(page,'theme')
            tables=['companies','batches','trainees','daily_attendance','attendance_10day','assessments','assessment_history']
            clean=state(owner)
            check('Every operational table is empty after owner setup', all(not clean[t] for t in tables))
            expect(page.locator('h1')).to_have_text('Welcome to the internal training system.')
            check('Empty dashboard shows onboarding, not invented results')
            page.wait_for_timeout(6800)
            if args.screenshots:
                dest=Path(args.screenshots); dest.mkdir(parents=True,exist_ok=True)
                page.screenshot(path=str(dest/'RED-Academy-Private-Workspace.png'),full_page=True)
            page.set_viewport_size({'width':390,'height':844})
            if args.screenshots:
                page.screenshot(path=str(dest/'RED-Academy-Private-Mobile.png'),full_page=False)
            for route in ['dashboard','batches','trainees','attendance','summaries','assessments','companies','analytics','settings']:
                go(page,route)
                check('Mobile empty '+route+' fits viewport',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
            page.set_viewport_size({'width':1440,'height':1050})
            go(page,'dashboard'); click(page,'new-company')
            page.locator('#entity-form [name="name"]').fill('QA Organization')
            save(page);check('Company created through form',len(state(owner)['companies'])==1)
            click(page,'new-batch')
            page.locator('[name="batch_name"]').fill('QA Training')
            page.locator('#entity-form [name="status"]').select_option('Active')
            page.locator('[data-action="add-session"]').click();page.locator('[data-action="add-session"]').click()
            save(page); check('Batch with more than ten scheduled sessions saves from the form',len(state(owner)['batches'][0]['session_dates'])==12)
            click(page,'new-trainee')
            page.locator('[name="trainee_name"]').fill('QA Enrollment')
            page.locator('[name="job_title"]').fill('Training candidate')
            save(page)
            data=state(owner); check('Enrollment preserves its report record while the live checklist is attendance-derived',len(data['trainees'])==1 and len(data['attendance_10day'])==1 and not any(data['attendance_10day'][0]['days']))
            batch=data['batches'][0]
            page.evaluate('(b)=>{__redTest.ctx.batchId=b.id;__redTest.ctx.date=b.session_dates[0];__redTest.ctx.go("attendance");}',batch)
            click(page,'edit-attendance')
            page.locator('[name="arrival"]').fill('11:45')
            page.locator('[name="departure"]').fill('18:00')
            expect(page.locator('#late-preview')).to_contain_text('45')
            save(page)
            check('Historical attendance saves calculated arrival without setting manual flag',not state(owner)['daily_attendance'][0]['is_late'])
            click(page,'edit-attendance')
            page.locator('[name="assessment_day"]').check()
            save(page)
            attendance=state(owner)['daily_attendance'][0]
            expect(page.locator('.session-day.active')).to_contain_text('1 present')
            check('Assessment day saves through the form and counts as regular present attendance',attendance['assessment_day'] and attendance['status']=='Present')
            click(page,'edit-attendance')
            page.locator('[name="status"]').select_option('Tour Day')
            save(page)
            expect(page.locator('.session-day.active')).to_contain_text('1 present')
            check('Tour Day entry counts as present in the daily roster',state(owner)['daily_attendance'][0]['status']=='Tour Day')
            click(page,'edit-attendance')
            page.locator('[name="status"]').select_option('Absent')
            save(page)
            expect(page.locator('.session-day.active')).to_contain_text('0 present')
            check('Tour no-show marked Absent counts as absent, not present',state(owner)['daily_attendance'][0]['status']=='Absent')
            click(page,'edit-attendance')
            page.locator('[name="status"]').select_option('Tour Day')
            save(page)
            go(page,'summaries')
            check('Tour Day is marked attended with its own checklist color',page.locator('.session-check-cell.tour').count()==1 and page.locator('.session-check-cell.present').count()==0)
            go(page,'attendance');click(page,'edit-attendance');page.locator('[name="status"]').select_option('Present');save(page)
            go(page,'summaries')
            check('Changing Daily Attendance updates the session checklist automatically',page.locator('.session-check-cell.present').count()==1 and page.locator('.session-check-cell.tour').count()==0)
            go(page,'assessments');click(page,'new-assessment')
            expect(page.locator('#preview-overall')).to_have_text('0.0%')
            check('New assessment never pre-fills a fabricated passing score')
            expect(page.locator('#assessment_batch_filter')).to_be_visible()
            expect(page.locator('#assessment_company_filter')).to_be_visible()
            expect(page.locator('[name="trainee_id"]')).to_be_visible()
            check('New assessment cascades batch, company and trainee selection')
            page.locator('[name="mapping"]').fill('4.25')
            expect(page.locator('#mapping-slider')).to_have_value('4.25')
            page.locator('#mapping-slider').evaluate("el=>{el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}))}")
            expect(page.locator('[name="mapping"]')).to_have_value('5')
            for key,value in [('product_knowledge',5),('presentability',5),('soft_skills',4.5)]:
                page.locator('[name="'+key+'"]').fill(str(value))
            expect(page.locator('#preview-overall')).to_have_text('97.5%')
            expect(page.locator('[name="assessment_outcome"]')).to_have_value('Aced')
            check('Typed marks and sliders stay synchronized and recalculate the outcome')
            save(page);check('Assessment persists',len(state(owner)['assessments'])==1)
            click(page,'edit-assessment')
            page.locator('[name="instructor_comment"]').fill('Reviewed in isolated QA only.')
            save(page);check('Assessment revision keeps history',len(state(owner)['assessment_history'])==1)
            page.evaluate('(id)=>__redTest.ctx.go("batches",{detailId:id})',batch['id'])
            expect(page.locator('[data-action="batch-report"]')).to_have_count(1)
            check('Batch detail exposes the internal trainee report generator')
            click(page,'batch-report')
            expect(page.locator('#academy-report-builder')).to_be_visible()
            expect(page.locator('body')).not_to_contain_text(re.compile(r'not set',re.I))
            check('Batch enrollment is shown without a misleading unset denominator')
            page.locator('[data-academy-build-report]').click()
            expect(page.locator('#academy-report-preview')).to_be_visible()
            expect(page.locator('#academy-report-preview')).to_contain_text('Trainee Performance Report')
            expect(page.locator('#academy-report-preview')).to_contain_text('QA Enrollment')
            expect(page.locator('#academy-report-preview')).to_contain_text('97.5%')
            check('Academy report preview connects saved roster, attendance and assessment records')
            page.locator('[data-academy-back]').click()
            expect(page.locator('#academy-report-builder')).to_be_visible()
            click(page,'close-modal')
            expect(page.locator('#academy-report-builder')).to_have_count(0)
            go(page,'settings');click(page,'users')
            click(page,'invite-team')
            page.locator('#invite-form [name="full_name"]').fill('QA Viewer')
            page.locator('#invite-form [name="email"]').fill('viewer@example.test')
            page.locator('#invite-form [type="submit"]').click()
            expect(page.locator('#invitation-link')).to_be_visible()
            invitation=page.locator('#invitation-link').input_value()
            check('Administrator creates an invitation without public signup', '/#/join/' in invitation)
            viewer_context=browser.new_context(viewport={'width':390,'height':844})
            viewer_page=viewer_context.new_page();viewer_page.on('pageerror',lambda error:errors.append(str(error)))
            viewer=h.Transport();h.mount(viewer_page,viewer,'#'+invitation.split('#',1)[1])
            expect(viewer_page.locator('#auth-form')).to_have_attribute('data-mode','join')
            check('Invitation secret is removed from visible fragment after parsing',viewer_page.evaluate('location.hash')=='#/join')
            viewer_page.locator('[name="password"]').fill(password)
            viewer_page.locator('[name="confirm_password"]').fill(password)
            viewer_page.locator('#auth-form [type="submit"]').click()
            expect(viewer_page.locator('#auth-form')).to_have_attribute('data-mode','login')
            check('Invited staff member chooses their own password')
            login(viewer_page,'viewer@example.test',password)
            check('Invited role is enforced from the server',viewer_page.evaluate('__redTest.store.user.role')=='viewer')
            go(viewer_page,'trainees')
            check('Viewer has no trainee-create control',viewer_page.locator('[data-action="new-trainee"]').count()==0)
            response=viewer.call('mutate','POST',{'table':'companies','action':'create','data':{'name':'Not allowed'}})
            check('Viewer direct write is refused by real API',response['status']==403)
            response=viewer.call('invitations')
            check('Viewer cannot list team invitations',response['status']==403)
            for route in ['dashboard','batches','trainees','attendance','summaries','assessments','companies','analytics','settings']:
                go(viewer_page,route)
                check('Mobile populated '+route+' fits viewport',viewer_page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
            click(viewer_page,'change-password')
            viewer_page.locator('[name="currentPassword"]').fill(password)
            viewer_page.locator('#password-form [name="password"]').fill('Changed-QA-Password-456!')
            viewer_page.locator('#password-form [name="confirm"]').fill('Changed-QA-Password-456!')
            viewer_page.locator('#password-form [type="submit"]').click()
            expect(viewer_page.locator('#auth-form')).to_have_attribute('data-mode','login')
            check('Password change locks the browser and revokes server session',viewer.call('state')['status']==401)
            go(viewer_page,'trainees')
            check('Anonymous deep route remains a login screen',viewer_page.locator('#auth-form').count()==1 and viewer_page.locator('main table').count()==0)
            check('Signed-out in-memory trainee data is cleared',viewer_page.evaluate('__redTest.store.data.trainees.length')==0)
            click(page,'close-modal')
            go(page,'trainees')
            click(page,'edit-trainee')
            page.locator('[name="enrollment_status"]').select_option('Stopped Attending')
            save(page)
            check('Trainee can be marked stopped while remaining in the retained roster',state(owner)['trainees'][0]['enrollment_status']=='Stopped Attending')
            go(page,'attendance')
            expect(page.locator('body')).to_contain_text('No matching trainees')
            check('Stopped attendee is omitted from the new attendance roster')
            go(page,'trainees')
            page.locator('[data-field="traineeStatus"]').select_option('Stopped Attending')
            click(page,'profile')
            expect(page.locator('.modal [data-action="delete-trainee"]')).to_contain_text('Delete trainee')
            click(page,'close-modal')
            expect(page.locator('[data-action="delete-trainee"]')).to_contain_text('Delete')
            click(page,'delete-trainee')
            click(page,'confirm')
            page.wait_for_function('__redTest.store.data.trainees.length===0')
            check('Administrator can confirm trainee deletion while assessment history is retained',not state(owner)['trainees'] and len(state(owner)['assessment_history'])>=1)
            page.evaluate('(id)=>__redTest.ctx.go("batches",{detailId:id})',batch['id'])
            expect(page.locator('[data-action="delete-batch"]')).to_have_count(1)
            expect(page.locator('[data-action="delete-batch"]')).to_contain_text('Delete batch')
            click(page,'delete-batch')
            click(page,'confirm')
            page.wait_for_function('__redTest.store.data.batches.length===0')
            check('Administrator can confirm batch deletion after its enrollments are removed',not state(owner)['batches'])
            if args.screenshots:
                viewer_page.set_viewport_size({'width':1440,'height':1000})
                viewer_page.wait_for_timeout(6800)
                viewer_page.screenshot(path=str(dest/'RED-Academy-Private-Login.png'),full_page=True)
            down_context=browser.new_context()
            down_page=down_context.new_page()
            class Offline:
                def send(self,args):raise RuntimeError('Simulated disconnected server')
            h.mount(down_page,Offline())
            down_page.wait_for_function('__redTest.store.status==="unavailable"')
            check('Unavailable server locks app instead of loading a demo',down_page.locator('[data-action="retry-connection"]').count()==1 and down_page.locator('main table').count()==0)
            check('No uncaught application JavaScript errors',not errors)
            browser.close()
    finally:
        server.terminate()
        try:server.wait(timeout=5)
        except subprocess.TimeoutExpired:server.kill();server.wait()

result={'suite':'Chromium DOM + real HTTP bridge','passed':len(checks),'failed':0,'checks':checks,'errors':errors,
'limitations':['In-memory HTTP transport; not native browser cookie or navigation testing.','EventSource is simulated in DOM harness; native HTTP SSE is verified separately.','No service-worker, native download, or deployment TLS acceptance claim.']}
if args.results:
    Path(args.results).parent.mkdir(parents=True,exist_ok=True)
    Path(args.results).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
