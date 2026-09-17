/** Produce isolated export fixtures for verification; never called by the app. */
import fs from 'node:fs';
import path from 'node:path';
import {fixtures,base} from './fixtures.mjs';
import {emptyState,atCairo} from '../public/modules/core.mjs';
import {workbookData,makeXlsx} from '../public/modules/export.mjs';
if(!process.argv[2])throw new Error('Provide an output directory for disposable verification workbooks.');
const directory=path.resolve(process.argv[2]);fs.mkdirSync(directory,{recursive:true});
const f=fixtures(),state=emptyState();
state.companies=[f.company];state.batches=[f.batch];state.trainees=[{...f.trainee,notes:'=1+1'}];
state.assessments=[f.assessment];state.attendance_10day=[{...f.summary,days:[true,true,true,...Array(7).fill(false)]}];
state.daily_attendance=[base({trainee_id:f.trainee.id,batch_id:f.batch.id,date:f.batch.session_dates[0],status:'Present',arrival_time:atCairo(f.batch.session_dates[0],'11:45'),departure_time:atCairo(f.batch.session_dates[0],'18:00'),is_late:false})];
for(const [name,data] of [['empty',emptyState()],['populated',state]]){
 const ctx={store:{data,mode:'private'},batchId:'',companyId:'',route:'dashboard'};
 const file=path.join(directory,name+'.xlsx');if(fs.existsSync(file))throw new Error('Choose a new verification output directory.');
 fs.writeFileSync(file,Buffer.from(await makeXlsx(workbookData(ctx)).arrayBuffer()));
}
console.log('Created two isolated seven-sheet export fixtures. No operational database was accessed.');
