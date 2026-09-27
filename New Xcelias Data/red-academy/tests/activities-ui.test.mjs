import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTIVITY_CATALOG} from '../public/modules/activity-catalog.mjs';
import {activityPage} from '../public/modules/activities-page.mjs';

const context=(assignments=[])=>({
 route:'activities',batchId:'',companyId:'',activityLoading:false,activityError:'',
 activityAssignments:{assignments},
 store:{
  user:{id:'trainer'},
  data:{batches:[],companies:[],trainees:[]},
  canWrite:()=>true,
 },
});

test('The trainer activity catalog has 46 unique, stable legacy activity identifiers',()=>{
 assert.equal(ACTIVITY_CATALOG.length,46);
 assert.equal(new Set(ACTIVITY_CATALOG.map(item=>item.id)).size,46);
 assert.ok(ACTIVITY_CATALOG.some(item=>item.id==='propquest'));
});

test('The trainer workspace renders the shared-roster workflow and clearly marks manual progress',()=>{
 const html=activityPage(context());
 assert.match(html,/Plan an activity/);
 assert.match(html,/shared roster/i);
 assert.match(html,/automatic learner sign-in and game-result capture are not enabled yet/i);
 assert.match(html,/No activities assigned yet/);
});

test('Activity assignments escape trainee and trainer-provided text in the rendered table',()=>{
 const html=activityPage(context([{
  id:'assignment-id',batch_id:'batch-id',batch_name:'Batch 51',activity_id:'rapidfire',title:'Rapid Fire',
  status:'Open',created_by:'trainer@example.test',due_date:null,instructions:'Practice & reflect',
  participants:[{id:'participant-id',trainee_id:'trainee-id',trainee_name:'<img src=x onerror=alert(1)>',company_id:null,company_name:'RED',status:'Completed',score:85,trainer_feedback:'<script>alert(1)</script>',version:2}],
 }]));
 assert.doesNotMatch(html,/<img src=x/);
 assert.doesNotMatch(html,/<script>alert/);
 assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
});
