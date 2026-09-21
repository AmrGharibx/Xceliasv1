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
await fs.copyFile(path.join(root,'node_modules','html2canvas','dist','html2canvas.min.js'),path.join(output,'vendor','html2canvas.min.js'));
await fs.copyFile(path.join(root,'node_modules','jspdf','dist','jspdf.umd.min.js'),path.join(output,'vendor','jspdf.umd.min.js'));
const fontDir=path.join(output,'vendor','fonts');
await fs.mkdir(fontDir,{recursive:true});
for(const [packageName,fileName] of [
 ['@fontsource/montserrat/files/montserrat-latin-400-normal.woff2','montserrat-400.woff2'],
 ['@fontsource/montserrat/files/montserrat-latin-500-normal.woff2','montserrat-500.woff2'],
 ['@fontsource/montserrat/files/montserrat-latin-600-normal.woff2','montserrat-600.woff2'],
 ['@fontsource/montserrat/files/montserrat-latin-700-normal.woff2','montserrat-700.woff2'],
 ['@fontsource/montserrat/files/montserrat-latin-800-normal.woff2','montserrat-800.woff2'],
 ['@fontsource/montserrat/files/montserrat-latin-900-normal.woff2','montserrat-900.woff2'],
 ['@fontsource/sora/files/sora-latin-300-normal.woff2','sora-300.woff2'],
 ['@fontsource/sora/files/sora-latin-400-normal.woff2','sora-400.woff2'],
 ['@fontsource/sora/files/sora-latin-500-normal.woff2','sora-500.woff2'],
 ['@fontsource/sora/files/sora-latin-600-normal.woff2','sora-600.woff2'],
 ['@fontsource/sora/files/sora-latin-700-normal.woff2','sora-700.woff2'],
 ['@fontsource/sora/files/sora-latin-800-normal.woff2','sora-800.woff2'],
 ['@fontsource/playfair-display/files/playfair-display-latin-500-normal.woff2','playfair-500.woff2'],
 ['@fontsource/playfair-display/files/playfair-display-latin-600-normal.woff2','playfair-600.woff2'],
 ['@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2','playfair-700.woff2'],
 ['@fontsource/playfair-display/files/playfair-display-latin-800-normal.woff2','playfair-800.woff2']
])await fs.copyFile(path.join(root,'node_modules',packageName),path.join(fontDir,fileName));
const sourceReporter=path.resolve(root,'..','..','Report Generation 3','csp','reports-app.js');
const reporterSource=await fs.readFile(sourceReporter,'utf8');
const logoMatch=reporterSource.match(/const LOGO = `([\s\S]*?)`;/);
if(!logoMatch)throw new Error('The standalone Reporter Generator logo could not be found.');
await fs.writeFile(path.join(output,'report-logo.svg'),logoMatch[1]);
await fs.writeFile(path.join(output,'cloud-config.js'),`window.RED_ACADEMY_CLOUD=Object.freeze({apiUrl:${JSON.stringify(apiUrl)},supabaseUrl:${JSON.stringify(supabaseUrl)},publishableKey:${JSON.stringify(publishableKey)}});\n`,{mode:0o600});
await fs.writeFile(path.join(output,'.nojekyll'),'');
console.log(`Cloud build ready in ${output}`);
