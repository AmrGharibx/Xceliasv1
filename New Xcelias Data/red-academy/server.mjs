import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadEnv} from './server/env.mjs';
loadEnv();
process.umask(0o077);
process.env.APP_URL??=`http://localhost:${process.env.PORT||3000}`;
const configuredURL=new URL(process.env.APP_URL);
if(!['http:','https:'].includes(configuredURL.protocol)||configuredURL.username||configuredURL.password||configuredURL.pathname!=='/'||configuredURL.search||configuredURL.hash)throw new Error('APP_URL must be the exact HTTP(S) origin, without a path, credentials, query, or fragment.');
if(process.env.APP_ENV==='production'&&configuredURL.protocol!=='https:')throw new Error('Production requires an HTTPS APP_URL and a TLS reverse proxy.');
const [major,minor]=process.versions.node.split('.').map(Number);
if(major<22||(major===22&&minor<16)){console.error('The internal training system requires Node.js 22.16 or newer.');process.exit(1);}
const{handleApi,repository}=await import('./server/service.mjs');
const projectRoot=path.dirname(fileURLToPath(import.meta.url)),root=path.join(projectRoot,'public');
const localReportAssets=new Map([
 ['/vendor/html2canvas.min.js',path.join(projectRoot,'node_modules','html2canvas','dist','html2canvas.min.js')],
 ['/vendor/jspdf.umd.min.js',path.join(projectRoot,'node_modules','jspdf','dist','jspdf.umd.min.js')],
 ['/vendor/fonts/montserrat-400.woff2',path.join(projectRoot,'node_modules','@fontsource','montserrat','files','montserrat-latin-400-normal.woff2')],
 ['/vendor/fonts/montserrat-500.woff2',path.join(projectRoot,'node_modules','@fontsource','montserrat','files','montserrat-latin-500-normal.woff2')],
 ['/vendor/fonts/montserrat-600.woff2',path.join(projectRoot,'node_modules','@fontsource','montserrat','files','montserrat-latin-600-normal.woff2')],
 ['/vendor/fonts/montserrat-700.woff2',path.join(projectRoot,'node_modules','@fontsource','montserrat','files','montserrat-latin-700-normal.woff2')],
 ['/vendor/fonts/montserrat-800.woff2',path.join(projectRoot,'node_modules','@fontsource','montserrat','files','montserrat-latin-800-normal.woff2')],
 ['/vendor/fonts/montserrat-900.woff2',path.join(projectRoot,'node_modules','@fontsource','montserrat','files','montserrat-latin-900-normal.woff2')],
 ['/vendor/fonts/sora-300.woff2',path.join(projectRoot,'node_modules','@fontsource','sora','files','sora-latin-300-normal.woff2')],
 ['/vendor/fonts/sora-400.woff2',path.join(projectRoot,'node_modules','@fontsource','sora','files','sora-latin-400-normal.woff2')],
 ['/vendor/fonts/sora-500.woff2',path.join(projectRoot,'node_modules','@fontsource','sora','files','sora-latin-500-normal.woff2')],
 ['/vendor/fonts/sora-600.woff2',path.join(projectRoot,'node_modules','@fontsource','sora','files','sora-latin-600-normal.woff2')],
 ['/vendor/fonts/sora-700.woff2',path.join(projectRoot,'node_modules','@fontsource','sora','files','sora-latin-700-normal.woff2')],
 ['/vendor/fonts/sora-800.woff2',path.join(projectRoot,'node_modules','@fontsource','sora','files','sora-latin-800-normal.woff2')],
 ['/vendor/fonts/playfair-500.woff2',path.join(projectRoot,'node_modules','@fontsource','playfair-display','files','playfair-display-latin-500-normal.woff2')],
 ['/vendor/fonts/playfair-600.woff2',path.join(projectRoot,'node_modules','@fontsource','playfair-display','files','playfair-display-latin-600-normal.woff2')],
 ['/vendor/fonts/playfair-700.woff2',path.join(projectRoot,'node_modules','@fontsource','playfair-display','files','playfair-display-latin-700-normal.woff2')],
 ['/vendor/fonts/playfair-800.woff2',path.join(projectRoot,'node_modules','@fontsource','playfair-display','files','playfair-display-latin-800-normal.woff2')]
]);
const port=Number(process.env.PORT||3000),host=process.env.HOST||'127.0.0.1';
process.env.APP_URL??=`http://localhost:${port}`;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,process.env.APP_URL);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');if(configuredURL.protocol==='https:')res.setHeader('Strict-Transport-Security','max-age=31536000');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 if(url.pathname.startsWith('/api/')){
  let buffer=Buffer.alloc(0);for await(const chunk of req){buffer=Buffer.concat([buffer,chunk]);if(buffer.length>160000){res.writeHead(413);res.end('Request too large');return;}}
  const controller=new AbortController();res.on('close',()=>controller.abort());const request=new Request(url,{method:req.method,headers:req.headers,signal:controller.signal,...(!['GET','HEAD'].includes(req.method)?{body:buffer}: {})});
  const response=await handleApi(request);res.statusCode=response.status;response.headers.forEach((value,key)=>{if(key!=='set-cookie')res.setHeader(key,value);});const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('Set-Cookie',cookies);
  if(response.body){for await(const chunk of response.body){if(res.destroyed)break;res.write(chunk);}}res.end();return;
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 let pathname=decodeURIComponent(url.pathname);if(pathname.split('/').some(segment=>segment.startsWith('.'))){res.writeHead(404);res.end('Not found');return;}
 const localReportAsset=localReportAssets.get(pathname);
 let filename=localReportAsset||path.resolve(root,'.'+pathname);
 if(!localReportAsset&&!filename.startsWith(root+path.sep)&&filename!==root){res.writeHead(403);res.end();return;}
 if(!localReportAsset&&(pathname==='/'||!path.extname(pathname)))filename=path.join(root,'index.html');
 if(!fs.existsSync(filename)||!fs.statSync(filename).isFile()){res.writeHead(404);res.end('Not found');return;}
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
 res.setHeader('Content-Type',types[path.extname(filename)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');
 if(req.method==='HEAD'){res.end();return;}fs.createReadStream(filename).pipe(res);
 }catch(e){console.error(e);if(!res.headersSent)res.writeHead(500);res.end('Server error');}
});
const repo=await repository();server.listen(port,host,()=>console.log(`Internal training system is ready at ${process.env.APP_URL}\nInternal company workspace. Sign-in required.\n`));
server.requestTimeout=30000;server.headersTimeout=15000;
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'This port is already in use. Close the other server or change PORT and APP_URL.':error.message);process.exit(1);});
let stopping=false;function shutdown(){if(stopping)return;stopping=true;server.close(()=>{repo.close();process.exit(0);});setTimeout(()=>{server.closeAllConnections();repo.close();process.exit(0);},2500).unref();}process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
