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
 assert.match(publicHandler,/if\(action==='enroll'\)\{\s*throw new ApiError\(409/);
});

test('cloudQrExpiryIsAppliedToExistingAndNewPublicSessions',()=>{
 assert.match(source,/isQrBatchExpired\(batch\)/);
 assert.match(source,/end_date,session_dates/);
 assert.match(source,/expiresAt:session\.expires_at/);
 assert.match(source,/session\.expires_at\)<=Date\.now\(\)/);
 assert.match(source,/expiresAt:saved\?\.expires_at\|\|opened\.expiresAt/);
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
 for(const action of ['ensure_link','rotate_link','upsert_venue','open_session','close_session','resolve_review','qr_issue_device_recovery_code'])assert.ok(staffHandler.includes(`'${action}'`));
 assert.match(staffHandler,/canWrite\(user\)/);
 assert.match(staffHandler,/red_qr_manage/);
});

test('participantPageLocalizesInvalidPassAndNetworkFeedbackInEgyptianArabic',()=>{
 assert.match(participantPage,/function localizeFeedbackMessage\(message\)\{if\(language!=='ar'\|\|typeof message!=='string'\)return message;if\(\/invalid\|no longer active\/i\.test\(message\)\)return strings\[language\]\.invalid;/);
 assert.match(participantPage,/page\.feedback\.textContent=localizeFeedbackMessage\(message\)/);
});

test('cloudQrRateLimitsUseOpaqueOrHashedKeysAndNeverSendPlainActivationCode',()=>{
 assert.match(publicHandler,/p_code_hash:activationCode\?tokenHash\(activationCode\):null/);
 assert.match(publicHandler,/tokenHash\(body\.credentialId\)/);
 assert.doesNotMatch(publicHandler,/p_activation_code|activationCode:\s*activationCode/);
 assert.match(staffHandler,/const activationCode=qrActivationCode\(\),codeHash=tokenHash\(activationCode\)/);
 assert.match(staffHandler,/rate\(`qr:issue:/);
});

test('cloudQrDeviceLinkCreationIsGenericRateLimitedAndStoresOnlyCodeHash',()=>{
 assert.match(publicHandler,/device-link-requests/);
 assert.match(publicHandler,/normalizeQrPhone\(body\.phone\)/);
 assert.match(publicHandler,/normalizeActivationCode\(body\.activationCode\)/);
 assert.match(publicHandler,/qr_create_device_link_request/);
 assert.match(publicHandler,/p_code_hash:activationCode\?tokenHash\(activationCode\):null/);
 const creation=publicHandler.slice(publicHandler.indexOf("if(action==='device-link-requests')"),publicHandler.indexOf("if(action==='device-link-status')"));
 assert.doesNotMatch(creation,/p_activation_code|traineeName/);
 assert.match(publicHandler,/rate\(`qr:link-request:/);
 assert.match(publicHandler,/qr:link-client:/);
 assert.match(publicHandler,/qrClientRateHash\(request\)/);
 assert.match(publicHandler,/status:'pending'/);
});

test('cloudQrClientThrottleUsesGatewayAddressAndStoresOnlyHmac',()=>{
 const helper=source.slice(source.indexOf('function normalizedClientIp'),source.indexOf('async function qrPublicRoute'));
 assert.match(helper,/cf-connecting-ip/);
 assert.match(helper,/x-real-ip/);
 assert.doesNotMatch(helper,/x-forwarded-for/);
 assert.match(helper,/createHmac\('sha256',secretKey\)/);
 assert.match(helper,/\.digest\('hex'\)/);
 assert.doesNotMatch(helper,/return address/);
});

test('cloudQrDeviceStatusVerifiesP256PossessionBeforeIdentityRpc',()=>{
 const proofLookup=publicHandler.indexOf("rpc('qr_device_link_request_proof_key'");
 const verify=publicHandler.indexOf('verifyP256Challenge(');
 const identityStatus=publicHandler.indexOf("rpc('qr_device_link_request_status'");
 assert.ok(proofLookup>=0&&verify>proofLookup&&identityStatus>verify,'verify the request signature before asking for identity-bearing status');
 assert.match(publicHandler,/xcelias-qr-link-status:v1\\n\$\{batchQrId\}\\n\$\{body\.requestHandle\}/);
 assert.match(publicHandler,/p_handle_hash:handleHash/);
 assert.match(publicHandler,/status==='approved'/);
 assert.doesNotMatch(publicHandler,/return json\(request,statusResult\)/);
 assert.match(publicHandler,/rate\(`qr:link-status:/);
});

test('cloudQrLegacyDirectEnrollmentFailsClosedWithoutEnrollmentRpc',()=>{
 const enroll=publicHandler.slice(publicHandler.indexOf("if(action==='enroll')"),publicHandler.indexOf("if(action==='challenge')"));
 assert.match(enroll,/throw new ApiError\(409/);
 assert.doesNotMatch(enroll,/red_qr_public_enroll|qr_attendance_enrollments/);
});

test('cloudQrDeviceApprovalQueueAndResolutionAreStaffOnly',()=>{
 assert.match(source,/const session=await requireUser\(request\),user=session\.user;\s*const qrTrainerResponse=await qrTrainerRoute\(request,route,method,user\);/);
 assert.match(staffHandler,/path==='device-link-requests'&&method==='GET'[\s\S]+?canWrite\(user\)[\s\S]+?qr_device_link_requests/);
 const resolveIndex=staffHandler.indexOf("if(path==='device-link-requests/resolve'");
 assert.ok(staffHandler.lastIndexOf('canWrite(user);',resolveIndex)>=0&&staffHandler.indexOf('qr_resolve_device_link_request',resolveIndex)>resolveIndex);
 assert.match(staffHandler,/p_actor:user\.email/);
 assert.match(staffHandler,/p_trainee_id:body\.traineeId\|\|null/);
});

test('cloudQrRecoveryCodeUsesNarrowRpcAndDoesNotRevokeEnrollmentAtIssueTime',()=>{
 assert.match(staffHandler,/qr_issue_device_recovery_code/);
 assert.doesNotMatch(staffHandler,/rpc\('red_qr_manage',\{p_action:'issue_code'/);
 assert.doesNotMatch(staffHandler,/qr_attendance_activation_codes'.*order:'issued_at\.desc'/);
 assert.match(staffHandler,/expiresAt:data\?\.expiresAt/);
});
