import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../supabase/functions/academy/index.ts',import.meta.url),'utf8');
const publicHandler=source.slice(source.indexOf('async function qrPublicRoute'),source.indexOf('async function qrTrainerState'));
const staffHandler=source.slice(source.indexOf('async function qrTrainerRoute'),source.indexOf('function validateLearnerCode'));
const participantPage=fs.readFileSync(new URL('../public/qr-attendance/qr-attendance.mjs',import.meta.url),'utf8');

test('cloudQrPublicEndpointsUseNoStoreAndNeverExposeRosterOrWorkspaceState',()=>{
 assert.match(source,/Cache-Control':'no-store'/);
 for(const action of ['info','enroll','challenge','check-in'])assert.ok(publicHandler.includes(`'${action}'`));
 assert.doesNotMatch(publicHandler,/workspaceState|red_workspace_state|roster|assessments/);
 assert.match(publicHandler,/daily_attendance',\{select:'status,arrival_time,source_meta',trainee_id:`eq\.\$\{enrollment\.trainee_id\}`/);
 assert.match(source,/const qrPublicResponse=await qrPublicRoute\(request,route,request\.method\);if\(qrPublicResponse\)return qrPublicResponse;/);
 assert.match(publicHandler,/evaluateVenueLocation\(/);
});

test('cloudQrNeverSendsRawTraineeCoordinatesToDatabaseRpc',()=>{
 assert.match(publicHandler,/locationResult=evaluateVenueLocation\(location/);
 const rpcBody=publicHandler.slice(publicHandler.indexOf("rpc('red_qr_public_checkin'"),publicHandler.indexOf("rpc('red_qr_public_checkin'")+900);
 assert.match(rpcBody,/p_location_outcome/);
 assert.match(rpcBody,/p_accuracy_band/);
 assert.match(rpcBody,/p_distance_band/);
 assert.doesNotMatch(rpcBody,/p_latitude|p_longitude|latitude:location|longitude:location/);
 assert.match(publicHandler,/challenge_hash!==tokenHash\(body\.challenge\)/);
 assert.match(publicHandler,/verifyP256Challenge\(enrollment\.public_key,body\.challenge,body\.signature\)/);
});

test('cloudQrStaffEndpointsRemainBehindRequireUser',()=>{
 assert.match(source,/const session=await requireUser\(request\),user=session\.user;\s*const qrTrainerResponse=await qrTrainerRoute\(request,route,method,user\);/);
 for(const action of ['ensure_link','rotate_link','issue_code','upsert_venue','open_session','close_session','resolve_review'])assert.ok(staffHandler.includes(`'${action}'`));
 assert.match(staffHandler,/canWrite\(user\)/);
 assert.match(staffHandler,/red_qr_manage/);
});

test('participantPageLocalizesInvalidPassAndNetworkFeedbackInEgyptianArabic',()=>{
 assert.match(participantPage,/function localizeFeedbackMessage\(message\)\{if\(language!=='ar'\|\|typeof message!=='string'\)return message;if\(\/invalid\|no longer active\/i\.test\(message\)\)return strings\[language\]\.invalid;/);
 assert.match(participantPage,/page\.feedback\.textContent=localizeFeedbackMessage\(message\)/);
});

test('cloudQrRateLimitsUseOpaqueOrHashedKeysAndNeverSendPlainActivationCode',()=>{
 assert.match(publicHandler,/const codeHash=tokenHash\(activationCode\)/);
 assert.match(publicHandler,/tokenHash\(body\.credentialId\)/);
 assert.doesNotMatch(publicHandler,/p_activation_code|activationCode:\s*activationCode/);
 assert.match(staffHandler,/const activationCode=qrActivationCode\(\),codeHash=tokenHash\(activationCode\)/);
 assert.match(staffHandler,/rate\(`qr:issue:/);
});
