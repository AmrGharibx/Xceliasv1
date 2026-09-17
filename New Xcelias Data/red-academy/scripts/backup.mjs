import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync,backup} from 'node:sqlite';
import {loadEnv} from '../server/env.mjs';
loadEnv();
process.umask(0o077);
const source=process.env.DATABASE_PATH||'./data/red-academy.db';
if(!fs.existsSync(source))throw new Error('No local database was found.');
const dest=process.argv[2]||`./backups/academy-${new Date().toISOString().replaceAll(':','-')}.db`;
if(fs.existsSync(dest))throw new Error('The backup destination already exists. Choose a new filename.');
fs.mkdirSync(path.dirname(path.resolve(dest)),{recursive:true,mode:0o700});
const db=new DatabaseSync(source,{readOnly:true});
try{await backup(db,dest);fs.chmodSync(dest,0o600);console.log(`Database backup created: ${path.resolve(dest)}\nContains personal data. Encrypt and restrict access to the backup.`);}finally{db.close();}
