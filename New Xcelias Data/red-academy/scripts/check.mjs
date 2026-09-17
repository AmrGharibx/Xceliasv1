import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?['node_modules','.next','data','.git'].includes(entry.name)?[]:walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);}
const files=walk(root).filter(f=>f.endsWith('.mjs')||f.endsWith('.js'));
let failures=0;
for(const file of files){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status!==0){failures++;console.error(result.stderr);}}
console.log(`${files.length} JavaScript files checked; ${failures} syntax errors.`);
process.exitCode=failures?1:0;
