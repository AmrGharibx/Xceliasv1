"""Prove the source importer never resets an existing workspace. Uses disposable copies."""
from pathlib import Path
import argparse,hashlib,json,shutil,sqlite3,subprocess,sys,tempfile
root=Path(__file__).resolve().parents[1];p=argparse.ArgumentParser();p.add_argument('--results',type=Path);a=p.parse_args();checks=[]
def check(name,value):
 if not value:raise AssertionError(name)
 checks.append(name)
with tempfile.TemporaryDirectory(prefix='red-import-safety-') as tmp:
 tmp=Path(tmp);existing=tmp/'edited.db';shutil.copy2(root/'data/red-academy.db',existing)
 db=sqlite3.connect(existing);bid=db.execute('SELECT id FROM batches LIMIT 1').fetchone()[0];db.execute('UPDATE batches SET description=? WHERE id=?',('An operator edit that must survive reimport.',bid));db.commit();db.close()
 args=[sys.executable,str(root/'scripts/import-notion.py'),str(root/'archive/Notion-Original.zip'),'--database',str(existing),'--report',str(tmp/'report.json')]
 run=subprocess.run(args,cwd=root,text=True,capture_output=True,timeout=60)
 check('Same-source repeat import is a successful no-op',run.returncode==0 and 'already imported' in run.stdout)
 db=sqlite3.connect(existing);check('Later operational edit survives repeat import',db.execute('SELECT description FROM batches WHERE id=?',(bid,)).fetchone()[0]=='An operator edit that must survive reimport.');check('Repeat import creates no duplicate batches or archive rows',db.execute('SELECT COUNT(*) FROM batches').fetchone()[0]==42 and db.execute('SELECT COUNT(*) FROM source_records').fetchone()[0]==4815);db.close()
 other=tmp/'unrelated.db';db=sqlite3.connect(other);db.execute('CREATE TABLE protected_note(value TEXT)');db.execute('INSERT INTO protected_note VALUES(?)',('Do not overwrite',));db.commit();db.close();before=hashlib.sha256(other.read_bytes()).hexdigest();args[args.index('--database')+1]=str(other)
 run=subprocess.run(args,cwd=root,text=True,capture_output=True,timeout=60);check('Existing unrelated database is refused',run.returncode!=0 and 'Destination exists' in run.stderr);check('Refused database bytes remain identical',hashlib.sha256(other.read_bytes()).hexdigest()==before)
report={'ok':True,'checks':len(checks),'check_names':checks};print(json.dumps(report,indent=2))
if a.results:a.results.write_text(json.dumps(report,indent=2))
