/** Generate full import exports from a READ-ONLY database connection. QA only. */
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {emptyState} from '../public/modules/core.mjs';
import {workbookData,makeXlsx} from '../public/modules/export.mjs';
const dir=process.argv[2];if(!dir)throw new Error('Choose a new QA output directory.');
fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'imported.xlsx');if(fs.existsSync(file))throw new Error('Refusing to overwrite QA workbook.');
const database=path.resolve(process.argv[3]||new URL('../data/red-academy.db',import.meta.url).pathname);
const db=new DatabaseSync(database,{readOnly:true}),data=emptyState();
for(const table of ['companies','batches','trainees','daily_attendance','attendance_10day','assessments'])data[table]=db.prepare('SELECT * FROM '+table+' ORDER BY created_at,id').all().map(row=>{row={...row};for(const k of ['source_meta','days','session_dates'])if(typeof row[k]==='string')row[k]=JSON.parse(row[k]);for(const k of ['is_late','analytics_included'])if(k in row)row[k]=!!row[k];return row;});
data.batches.sort((a,b)=>a.batch_name.localeCompare(b.batch_name,undefined,{numeric:true}));data.assessments.sort((a,b)=>Number(b.analytics_included)-Number(a.analytics_included));
const sheets=workbookData({store:{data,mode:'private'},batchId:'',companyId:'',route:'dashboard'});
fs.writeFileSync(file,Buffer.from(await makeXlsx(sheets).arrayBuffer()));
fs.writeFileSync(path.join(dir,'export-expected.json'),JSON.stringify(sheets,null,2));
db.close();console.log('Full import workbook and verification expectations written to '+dir+'. No operational records modified.');
