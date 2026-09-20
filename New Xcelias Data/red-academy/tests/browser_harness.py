"""Browser DOM harness; HTTP uses the real private server via a local test transport.
No managed browser policies are modified. This is not a substitute for native hosted acceptance testing.
"""
from pathlib import Path
import re,json,posixpath,urllib.request,urllib.error,http.cookiejar
ROOT=Path(__file__).resolve().parents[1]
BASE='http://localhost:3000'
class Transport:
 def __init__(self):
  self.jar=http.cookiejar.CookieJar();self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
 def send(self,args):
  method=args.get('method','GET');headers={'Origin':BASE,'X-Red-Request':'1','Content-Type':'application/json'}
  headers.update(args.get('headers',{}))
  body=args.get('body');body=None if body is None else body.encode()
  request=urllib.request.Request(BASE+args['path'],method=method,data=body,headers=headers)
  try: response=self.opener.open(request,timeout=20)
  except urllib.error.HTTPError as e: response=e
  return {'status':response.status,'text':response.read().decode(),'headers':dict(response.headers)}
 def call(self,path,method='GET',body=None):
  return self.send({'path':'/api/'+path,'method':method,'body':json.dumps(body) if body is not None else None})
def bundle():
 mods={};order=[]
 def load(name):
  if name in mods:return
  code=(ROOT/'public'/name).read_text();mods[name]=None
  exports=[]
  def dep_path(dep):return posixpath.normpath(posixpath.join(posixpath.dirname(name),dep))
  def imported(m):
   keys,dep=m.groups();path=dep_path(dep);load(path)
   return 'const {'+re.sub(r'\s+as\s+',':',keys)+'}=__modules['+json.dumps(path)+'];'
  code=re.sub(r"import\s*\{([^}]+)\}\s*from\s*['\"]([^'\"]+)['\"];?",imported,code)
  def side_effect_import(m):
   load(dep_path(m.group(1)));return ''
  code=re.sub(r"import\s*['\"]([^'\"]+)['\"];?",side_effect_import,code)
  def reexport(m):
   keys,dep=m.groups();path=dep_path(dep);load(path)
   return ';'+''.join('__exports['+json.dumps(k.strip())+']=__modules['+json.dumps(path)+']['+json.dumps(k.strip())+'];' for k in keys.split(','))
  code=re.sub(r"export\s*\{([^}]+)\}\s*from\s*['\"]([^'\"]+)['\"];?",reexport,code)
  def simple_export(m):
   exports.extend(k.strip() for k in m.group(1).split(','));return ''
  code=re.sub(r'export\s*\{([^}]+)\};?',simple_export,code)
  def declaration(m):
   exports.append(m.group(2));return m.group(1)+m.group(2)
  code=re.sub(r'export\s+((?:async\s+)?(?:function|class|const|let|var)\s+)(\w+)',declaration,code)
  if name=='app.mjs':code+='\nglobalThis.__redTest={store,ctx};'
  assignment=';'+''.join('__exports['+json.dumps(k)+']='+k+';' for k in exports)
  mods[name]='__modules['+json.dumps(name)+']=await (async()=>{const __exports={};\n'+code+assignment+'return __exports;})();\n'
  order.append(name)
 load('app.mjs')
 return '(async()=>{const __modules={};'+''.join(mods[m] for m in order)+'})().catch(e=>{console.error(e);globalThis.__redBootError=e.message});'
def mount(page,transport,fragment=''):
 page.expose_function('__redHTTP',transport.send)
 page.set_content('<!doctype html><html><head><style>'+ (ROOT/'public/styles.css').read_text() +'</style></head><body><div id="app"></div><div id="modal-root"></div><div id="toast-root" aria-live="polite"></div></body></html>')
 page.evaluate('''() => {
 const data=new Map();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>{data.set(k,String(v));storage[k]=String(v);},removeItem:k=>{data.delete(k);delete storage[k];},clear:()=>{data.clear();},key:i=>[...data.keys()][i],get length(){return data.size;}};
 Object.defineProperty(window,'localStorage',{value:storage});
 window.fetch=async(path,opts={})=>{const r=await window.__redHTTP({path:String(path),method:opts.method||'GET',body:opts.body??null,headers:opts.headers||{}});return new Response(r.text,{status:r.status,headers:r.headers});};
 window.EventSource=class{constructor(){setTimeout(()=>this.onopen?.(),20);}close(){}};
 // No browser network navigation, native cookies, downloads, or SSE are claimed by this harness.
 }''')
 if fragment:page.evaluate('(fragment)=>history.replaceState(null,"",fragment)',fragment)
 page.add_script_tag(content=bundle())
 page.wait_for_function('Boolean(window.__redTest)||Boolean(window.__redBootError)',timeout=10000)
 error=page.evaluate('window.__redBootError||null')
 if error:raise RuntimeError(error)
