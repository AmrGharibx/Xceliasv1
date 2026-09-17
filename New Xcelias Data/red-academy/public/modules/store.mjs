import {emptyState} from './core.mjs';

/** The browser holds only an authenticated, in-memory snapshot. There is no local data mode. */
export class AcademyStore extends EventTarget {
 constructor() {
  super();
  this.data=emptyState();this.mode='private';this.user=null;this.status='loading';
  this.aiEnabled=false;this.sync='events';this.busy=false;this.generation=0;
  this.source=null;this.poll=null;this.connectionLost=false;this.setupRequired=false;
  this.error='';this.suspended=false;this.endingSession=false;
  this.channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('red-academy-private-auth'):null;
  this.channel?.addEventListener('message',event=>{if(event.data?.type==='signed-out'){this.lock();this.dispatchEvent(new Event('expired'));}});
  window.addEventListener('storage',event=>{if(event.key==='red-academy-auth-signal'){this.lock();this.dispatchEvent(new Event('expired'));}});
  // Remove only this application's old demonstration data, never unrelated browser storage.
  try {for(const key of Object.keys(localStorage))if(key.startsWith('red-academy-demo'))localStorage.removeItem(key);}catch{}
 }
 notify(){this.dispatchEvent(new Event('change'));}
 lock(status='signed-out') {
  this.generation++;this.source?.close();this.source=null;clearInterval(this.poll);this.poll=null;
  this.user=null;this.data=emptyState();this.aiEnabled=false;this.status=status;this.busy=false;this.notify();
 }
 expire(){this.lock();this.dispatchEvent(new Event('expired'));}
 async init() {
  const generation=++this.generation;
  this.status='loading';this.error='';this.notify();
  try {
   if(location.protocol==='file:')throw new Error('Start RED Academy with START-WINDOWS.bat or npm start, then open http://localhost:3000. This private application requires its server.');
   if(this.pendingLogout()){await this.api('auth/logout','POST',{});this.setPendingLogout(false);}
   const session=await this.api('session');if(generation!==this.generation)return;
   this.setupRequired=!!session.setupRequired;
   if(!session.user){this.lock(this.setupRequired?'setup':'signed-out');return;}
   this.user=session.user;this.aiEnabled=session.aiEnabled;this.status='ready';
   await this.refresh();if(generation===this.generation)this.connectSync();
  } catch(error) {
   if(generation===this.generation){this.lock('unavailable');this.error=error.message;this.notify();}
  }
 }
 pendingLogout(){try{return localStorage.getItem('red-academy-logout-pending')==='1';}catch{return this.suspended;}}
 setPendingLogout(value){this.suspended=value;try{if(value)localStorage.setItem('red-academy-logout-pending','1');else localStorage.removeItem('red-academy-logout-pending');}catch{}}
 async api(path,method='GET',body) {
  let response;
  try {
   response=await fetch('/api/'+path,{method,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(path==='ai'?50000:20000),headers:{'Content-Type':'application/json',...(method!=='GET'?{'X-Red-Request':'1'}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  } catch(error){this.connectionLost=true;const err=new Error('Cannot reach the RED Academy server. Check your connection and that the server is running.');err.cause=error;throw err;}
  const result=await response.json().catch(()=>({error:'The server did not return a valid response.'}));
  if(!response.ok){if(response.status===401&&!path.startsWith('auth/')&&!this.endingSession)this.expire();const err=new Error(result.error||'The request failed.');err.status=response.status;throw err;}
  this.connectionLost=false;return result;
 }
 async refresh() {
  if(!this.user||this.status!=='ready'||this.endingSession)return;
  const generation=this.generation;const data=await this.api('state');
  if(generation!==this.generation||!this.user)return;
  this.data=data;this.notify();
 }
 connectSync() {
  this.source?.close();clearInterval(this.poll);if(!this.user)return;
  this.source=new EventSource('/api/events');
  this.source.onmessage=()=>{if(!this.busy&&!this.endingSession)this.refresh().catch(()=>this.notify());};
  this.source.onerror=()=>{this.connectionLost=true;this.checkSession();};
  this.source.onopen=()=>{this.connectionLost=false;this.notify();};
  this.poll=setInterval(()=>{if(!document.hidden)this.checkSession();},60000);
 }
 async checkSession(){if(!this.user||this.endingSession)return;const generation=this.generation;try{const s=await this.api('session');if(generation!==this.generation)return;if(!s.user)this.expire();else{this.user=s.user;this.notify();}}catch{this.connectionLost=true;this.notify();}}
 async login(email,password) {
  this.endingSession=false;
  if(this.pendingLogout()){await this.api('auth/logout','POST',{});this.setPendingLogout(false);}
  await this.api('auth/login','POST',{email,password});
  const generation=++this.generation;
  try {
   const session=await this.api('session');if(!session.user)throw new Error('Your session could not be verified. Please sign in again.');
   this.user=session.user;this.aiEnabled=session.aiEnabled;this.status='ready';this.setupRequired=false;
   await this.refresh();if(generation===this.generation)this.connectSync();
  }catch(error){this.lock();throw error;}
 }
 async logout() {
  this.endingSession=true;
  this.setPendingLogout(true);this.lock();
  this.channel?.postMessage({type:'signed-out'});
  try{localStorage.setItem('red-academy-auth-signal',String(Date.now()));}catch{}
  try{await this.api('auth/logout','POST',{});this.setPendingLogout(false);}
  catch{throw new Error('This device is locked. Server sign-out will complete when you reconnect.');}
 }
 canWrite(){return this.status==='ready'&&['admin','instructor'].includes(this.user?.role);}
 canDelete(){return this.status==='ready'&&this.user?.role==='admin';}
 async mutate(table,action,record,data){return this.write({table,action,...(record?{id:record.id,expectedVersion:record.version}:{}),data});}
 async write(payload) {
  if(this.busy)throw new Error('A save is already in progress.');
  if(!this.canWrite())throw new Error('Your RED account does not have permission to edit this workspace.');
  if(payload.action==='delete'&&!this.canDelete())throw new Error('Only administrators can delete records.');
  const generation=this.generation;this.busy=true;
  try{
   const result=await this.api('mutate','POST',payload);
   if(generation!==this.generation)throw new Error('Your session changed. Sign in to verify the saved record.');
   try{await this.refresh();}catch{const error=new Error('The server saved your change, but the refreshed view could not be loaded. Reconnect before making further changes.');error.saved=true;throw error;}
   return result.records;
  }finally{this.busy=false;}
 }
}
