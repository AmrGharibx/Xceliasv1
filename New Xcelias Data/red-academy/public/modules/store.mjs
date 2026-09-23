import {emptyState} from './core.mjs';

const CLOUD_SESSION_KEY='red-academy-cloud-session';
const tokenIsValid=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{43}$/.test(value);
function cloudConfig(){
 const candidate=globalThis.RED_ACADEMY_CLOUD;
 if(!candidate||typeof candidate.apiUrl!=='string'||typeof candidate.supabaseUrl!=='string'||typeof candidate.publishableKey!=='string')return null;
 try{
  const apiUrl=new URL(candidate.apiUrl),supabaseUrl=new URL(candidate.supabaseUrl);
  if(apiUrl.protocol!=='https:'||apiUrl.username||apiUrl.password||apiUrl.search||apiUrl.hash||!/\/functions\/v1\/academy\/?$/.test(apiUrl.pathname))return null;
  if(supabaseUrl.protocol!=='https:'||supabaseUrl.username||supabaseUrl.password||supabaseUrl.search||supabaseUrl.hash||supabaseUrl.pathname!=='/'||!supabaseUrl.hostname.endsWith('.supabase.co'))return null;
  if(apiUrl.host!==supabaseUrl.host||!/^[A-Za-z0-9._-]{20,2048}$/.test(candidate.publishableKey))return null;
  return {apiUrl:apiUrl.href.replace(/\/$/,''),supabaseUrl:supabaseUrl.href.replace(/\/$/,''),publishableKey:candidate.publishableKey};
 }catch{return null;}
}

/** The browser holds only an authenticated, in-memory snapshot. There is no local data mode. */
export class AcademyStore extends EventTarget {
 constructor() {
  super();
  this.cloud=cloudConfig();this.sessionToken=null;this.revision=null;this.syncing=false;this.lastCloudCheck=0;
  this.data=emptyState();this.mode='private';this.user=null;this.status='loading';
  this.aiEnabled=false;this.aiPolishEnabled=false;this.sync=this.cloud?'poll':'events';this.busy=false;this.generation=0;
  this.source=null;this.poll=null;this.realtime=null;this.realtimeChannel=null;this.realtimeAvailable=false;this.connectionLost=false;this.setupRequired=false;
  this.error='';this.suspended=false;this.endingSession=false;
  this.channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('internal-training-private-auth'):null;
  this.channel?.addEventListener('message',event=>{if(event.data?.type==='signed-out'){this.lock();this.dispatchEvent(new Event('expired'));}});
  window.addEventListener('storage',event=>{if(event.key==='internal-training-auth-signal'){this.lock();this.dispatchEvent(new Event('expired'));}});
  // Remove only this application's old demonstration data, never unrelated browser storage.
  try {for(const key of Object.keys(localStorage))if(key.startsWith('internal-training-demo'))localStorage.removeItem(key);}catch{}
 }
 notify(){this.dispatchEvent(new Event('change'));}
 endpoint(path){return this.cloud?`${this.cloud.apiUrl}/${String(path).replace(/^\/+/, '')}`:`/api/${path}`;}
 requestHeaders(){return this.cloud&&this.sessionToken?{Authorization:`Bearer ${this.sessionToken}`}:{ };}
 loadCloudSession(){
  if(!this.cloud)return;
  try{const token=sessionStorage.getItem(CLOUD_SESSION_KEY);this.sessionToken=tokenIsValid(token)?token:null;if(token&&!this.sessionToken)sessionStorage.removeItem(CLOUD_SESSION_KEY);}catch{this.sessionToken=null;}
 }
 saveCloudSession(token){
  if(!this.cloud||!tokenIsValid(token))throw new Error('Your cloud sign-in could not be verified. Please try again.');
  this.sessionToken=token;try{sessionStorage.setItem(CLOUD_SESSION_KEY,token);}catch{}
 }
 clearCloudSession(){this.sessionToken=null;try{sessionStorage.removeItem(CLOUD_SESSION_KEY);}catch{}}
 closeRealtime(){
  const channel=this.realtimeChannel,client=this.realtime;
  this.realtimeChannel=null;this.realtime=null;this.realtimeAvailable=false;
  try{channel?.unsubscribe();}catch{}
  try{client?.removeChannel?.(channel);}catch{}
 }
 lock(status='signed-out') {
  this.generation++;this.source?.close();this.source=null;clearInterval(this.poll);this.poll=null;this.closeRealtime();
  if(this.cloud&&['signed-out','setup'].includes(status))this.clearCloudSession();
  this.user=null;this.data=emptyState();this.aiEnabled=false;this.aiPolishEnabled=false;this.revision=null;this.status=status;this.busy=false;this.syncing=false;this.notify();
 }
 expire(){this.lock();this.dispatchEvent(new Event('expired'));}
 async init() {
  const generation=++this.generation;
  this.status='loading';this.error='';this.loadCloudSession();this.notify();
  try {
   if(location.protocol==='file:')throw new Error('Open the company workspace through its configured server address. This application requires its protected server.');
   if(this.pendingLogout()){await this.api('auth/logout','POST',{});this.clearCloudSession();this.setPendingLogout(false);}
   const session=await this.api('session');if(generation!==this.generation)return;
   this.setupRequired=!!session.setupRequired;
   if(!session.user){this.lock(this.setupRequired?'setup':'signed-out');return;}
   this.user=session.user;this.aiEnabled=!!session.aiEnabled;this.aiPolishEnabled=!!session.aiPolishEnabled;this.sync=session.sync||this.sync;this.revision=Number.isInteger(session.revision)?session.revision:null;this.status='ready';
   await this.refresh();if(generation===this.generation)this.connectSync();
  } catch(error) {
   if(generation===this.generation){this.lock('unavailable');this.error=error.message;this.notify();}
  }
 }
 pendingLogout(){try{return localStorage.getItem('internal-training-logout-pending')==='1';}catch{return this.suspended;}}
 setPendingLogout(value){this.suspended=value;try{if(value)localStorage.setItem('internal-training-logout-pending','1');else localStorage.removeItem('internal-training-logout-pending');}catch{}}
 async api(path,method='GET',body) {
  let response;
  const headers={...this.requestHeaders()};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(!['GET','HEAD'].includes(method))headers['X-Red-Request']='1';
  try {
   response=await fetch(this.endpoint(path),{method,credentials:this.cloud?'omit':'same-origin',cache:'no-store',signal:AbortSignal.timeout(path==='ai'?50000:20000),headers,...(body!==undefined?{body:JSON.stringify(body)}:{})});
  } catch(error){this.connectionLost=true;const err=new Error(this.cloud?'Cannot reach the company workspace. Check your connection and try again.':'Cannot reach the internal training server. Check your connection and that the server is running.');err.cause=error;throw err;}
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
  this.source?.close();this.source=null;clearInterval(this.poll);this.poll=null;this.closeRealtime();if(!this.user)return;
  if(this.cloud){
   this.connectCloudRealtime();
   this.poll=setInterval(()=>{if(!document.hidden&&(!this.realtimeAvailable||Date.now()-this.lastCloudCheck>=300000))this.pollCloud().catch(()=>{});},60000);
   this.pollCloud().catch(()=>{});return;
  }
  if(this.sync==='poll'){
   this.poll=setInterval(()=>{if(!document.hidden)this.checkSession();},60000);
   this.checkSession();return;
  }
  this.source=new EventSource('/api/events');
  this.source.onmessage=()=>{if(!this.busy&&!this.endingSession)this.refresh().catch(()=>this.notify());};
  this.source.onerror=()=>{this.connectionLost=true;this.checkSession();};
  this.source.onopen=()=>{this.connectionLost=false;this.notify();};
  this.poll=setInterval(()=>{if(!document.hidden)this.checkSession();},60000);
 }
 connectCloudRealtime(){
  const library=globalThis.supabase;
  if(!library||typeof library.createClient!=='function'||!this.cloud)return false;
  try{
   const client=library.createClient(this.cloud.supabaseUrl,this.cloud.publishableKey,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
   const channel=client.channel('red-academy-live',{config:{private:false}})
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'academy_live_signal',filter:'singleton=eq.true'},payload=>{
     this.refreshFromLiveSignal(Number(payload?.new?.revision)).catch(()=>{});
    })
    .subscribe(status=>{
     this.realtimeAvailable=status==='SUBSCRIBED';
     if(this.realtimeAvailable)this.connectionLost=false;
     this.notify();
    });
   this.realtime=client;this.realtimeChannel=channel;return true;
  }catch{return false;}
 }
 async refreshFromLiveSignal(nextRevision){
  if(!this.cloud||!this.user||this.endingSession||this.busy||this.syncing)return;
  if(Number.isInteger(nextRevision)&&nextRevision===this.revision)return;
  this.syncing=true;
  try{
   await this.refresh();
   if(Number.isInteger(nextRevision))this.revision=nextRevision;
   this.connectionLost=false;this.notify();
  }catch{this.connectionLost=true;this.notify();}
  finally{this.syncing=false;}
 }
 async pollCloud(){
  if(!this.cloud||!this.user||this.endingSession||this.busy||this.syncing)return;
  this.syncing=true;this.lastCloudCheck=Date.now();
  try{
   const result=await this.api('sync');if(!result.user){this.expire();return;}
   const nextRevision=Number.isInteger(result.revision)?result.revision:null;
   this.user=result.user;
   if(nextRevision!==null&&this.revision!==null&&nextRevision!==this.revision){this.revision=nextRevision;await this.refresh();}
   else if(nextRevision!==null)this.revision=nextRevision;
   this.connectionLost=false;this.notify();
  }catch{this.connectionLost=true;this.notify();}
  finally{this.syncing=false;}
 }
 async checkSession(){if(!this.user||this.endingSession)return;const generation=this.generation;try{const s=await this.api('session');if(generation!==this.generation)return;if(!s.user)this.expire();else{this.user=s.user;this.aiEnabled=!!s.aiEnabled;this.aiPolishEnabled=!!s.aiPolishEnabled;this.sync=s.sync||this.sync;this.revision=Number.isInteger(s.revision)?s.revision:this.revision;this.notify();}}catch{this.connectionLost=true;this.notify();}}
 async login(email,password) {
  this.endingSession=false;
  if(this.pendingLogout()){await this.api('auth/logout','POST',{});this.clearCloudSession();this.setPendingLogout(false);}
  const signedIn=await this.api('auth/login','POST',{email,password});
  if(this.cloud)this.saveCloudSession(signedIn.token);
  const generation=++this.generation;
  try {
   const session=await this.api('session');if(!session.user)throw new Error('Your session could not be verified. Please sign in again.');
   this.user=session.user;this.aiEnabled=!!session.aiEnabled;this.aiPolishEnabled=!!session.aiPolishEnabled;this.sync=session.sync||this.sync;this.revision=Number.isInteger(session.revision)?session.revision:null;this.status='ready';this.setupRequired=false;
   await this.refresh();if(generation===this.generation)this.connectSync();
  }catch(error){this.clearCloudSession();this.lock();throw error;}
 }
 async logout() {
  this.endingSession=true;this.setPendingLogout(true);
  this.channel?.postMessage({type:'signed-out'});
  try{localStorage.setItem('internal-training-auth-signal',String(Date.now()));}catch{}
  let failure=null;
  try{await this.api('auth/logout','POST',{});this.setPendingLogout(false);}
  catch{failure=new Error('This device is locked. Server sign-out will complete when you reconnect.');}
  finally{this.clearCloudSession();this.lock();}
  if(failure)throw failure;
 }
 async traineePhoto(traineeId){
  let response;
  try{response=await fetch(this.endpoint('trainees/'+encodeURIComponent(traineeId)+'/photo'),{credentials:this.cloud?'omit':'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000),headers:this.requestHeaders()});}
  catch(error){this.connectionLost=true;throw new Error(this.cloud?'Cannot reach the company workspace. Check your connection and try again.':'Cannot reach the internal training server. Check your connection and that the server is running.');}
  if(response.status===404)return null;
  if(!response.ok){if(response.status===401&&!this.endingSession)this.expire();const result=await response.json().catch(()=>({error:'The trainee portrait could not be loaded.'}));const error=new Error(result.error||'The trainee portrait could not be loaded.');error.status=response.status;throw error;}
  this.connectionLost=false;return URL.createObjectURL(await response.blob());
 }
 async saveTraineePhoto(traineeId,photo){
  if(!this.canWrite())throw new Error('Your company account does not have permission to edit this workspace.');
  return this.api('trainees/'+encodeURIComponent(traineeId)+'/photo','PUT',{photo});
 }
 canWrite(){return this.status==='ready'&&['admin','instructor'].includes(this.user?.role);}
 canDelete(table=''){return this.canWrite()&&(this.user?.role==='admin'||['batches','trainees'].includes(table));}
 async mutate(table,action,record,data){return this.write({table,action,...(record?{id:record.id,expectedVersion:record.version}:{}),data});}
 async write(payload) {
  if(this.busy)throw new Error('A save is already in progress.');
  if(!this.canWrite())throw new Error('Your company account does not have permission to edit this workspace.');
  if(payload.action==='delete'&&!this.canDelete(payload.table))throw new Error('Your role cannot delete this record.');
  const generation=this.generation;this.busy=true;
  try{
   const result=await this.api('mutate','POST',payload);
   if(generation!==this.generation)throw new Error('Your session changed. Sign in to verify the saved record.');
   try{await this.refresh();}catch{const error=new Error('The server saved your change, but the refreshed view could not be loaded. Reconnect before making further changes.');error.saved=true;throw error;}
   return result.records;
  }finally{this.busy=false;}
 }
}
