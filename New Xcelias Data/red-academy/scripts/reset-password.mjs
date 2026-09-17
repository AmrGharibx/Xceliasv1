import fs from 'node:fs';
import {loadEnv} from '../server/env.mjs';
import {SQLiteRepository,hashPassword} from '../server/sqlite.mjs';
import {id} from '../public/modules/core.mjs';
loadEnv();
process.umask(0o077);
const file=process.env.DATABASE_PATH||'./data/red-academy.db';
if(!fs.existsSync(file))throw new Error('The database does not exist. Start the academy once before resetting a password.');
const email=process.env.RESET_EMAIL?.trim().toLowerCase(),password=process.env.RESET_PASSWORD;
if(!email||!password)throw new Error('Set RESET_EMAIL and RESET_PASSWORD in your temporary process environment. Minimum password length: 12 characters.');
const repo=new SQLiteRepository(file);
try{
 const user=repo.db.prepare('SELECT id FROM users WHERE email=?').get(email);
 if(!user)throw new Error('No matching local user.');
 const hash=await hashPassword(password);
 repo.db.exec('BEGIN IMMEDIATE');
 try{
  repo.db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash,user.id);
  repo.db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);
  repo.insert('audit_log',{id:id(),actor:'Local maintenance',action:'password-reset',entity:'users',entity_id:user.id,details:'Password reset; all existing sessions revoked.',created_at:new Date().toISOString()});
  repo.db.exec('COMMIT');
 }catch(error){repo.db.exec('ROLLBACK');throw error;}
 console.log('Password updated. Existing sessions were revoked. User role and approval status were not changed.');
}finally{repo.close();delete process.env.RESET_PASSWORD;}
