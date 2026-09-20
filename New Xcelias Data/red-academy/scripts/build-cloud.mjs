import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const configPath=path.join(root,'cloud','production.json');
const checkOnly=process.argv.includes('--check');
let config={};
try{config=JSON.parse(await fs.readFile(configPath,'utf8'));}catch{}
const configured=(name,key)=>Object.hasOwn(process.env,name)?process.env[name]:(config[key]||'');
function validApiUrl(value){
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash&&/\/functions\/v1\/academy\/?$/.test(url.pathname)?url.href.replace(/\/$/,''):null;}catch{return null;}
}
function validSupabaseUrl(value){
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==='/'&&url.hostname.endsWith('.supabase.co')?url.href.replace(/\/$/,''):null;}catch{return null;}
}
function validPublishableKey(value){return typeof value==='string'&&/^[A-Za-z0-9._-]{20,2048}$/.test(value)?value:null;}
const apiUrl=validApiUrl(configured('RED_ACADEMY_CLOUD_API_URL','apiUrl'));
const supabaseUrl=validSupabaseUrl(configured('RED_ACADEMY_SUPABASE_URL','supabaseUrl'));
const publishableKey=validPublishableKey(configured('RED_ACADEMY_SUPABASE_PUBLISHABLE_KEY','publishableKey'));
const ready=!!apiUrl&&!!supabaseUrl&&!!publishableKey&&new URL(apiUrl).host===new URL(supabaseUrl).host;
if(checkOnly){console.log(ready?'true':'false');process.exit(0);}
if(!ready)throw new Error('Set cloud/production.json to the matching HTTPS Supabase project URL, academy Edge Function URL, and publishable key before publishing the cloud build.');
const output=path.resolve(root,'cloud-dist');
if(path.relative(root,output).startsWith('..')||path.relative(root,output)==='')throw new Error('Cloud output path is invalid.');
await fs.rm(output,{recursive:true,force:true});
await fs.cp(path.join(root,'public'),output,{recursive:true,filter:source=>!source.endsWith('.DS_Store')});
await fs.copyFile(path.join(root,'node_modules','@supabase','supabase-js','dist','umd','supabase.js'),path.join(output,'vendor','supabase.js'));
await fs.writeFile(path.join(output,'cloud-config.js'),`window.RED_ACADEMY_CLOUD=Object.freeze({apiUrl:${JSON.stringify(apiUrl)},supabaseUrl:${JSON.stringify(supabaseUrl)},publishableKey:${JSON.stringify(publishableKey)}});\n`,{mode:0o600});
await fs.writeFile(path.join(output,'.nojekyll'),'');
console.log(`Cloud build ready in ${output}`);
