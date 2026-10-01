import test from 'node:test';
import assert from 'node:assert/strict';
import {activityCohortPulse,activityPracticeInsights,gradeStudioQuiz,liveRoomQuestionView,publicQuiz,STUDIO_SKILLS,studioFacilitatorDeck,studioLibrary,studioQuiz,validateStudioArabicChallenge,validateStudioChallenge,validateStudioDraftRequest,validateStudioQuizDraft} from '../server/activity-studio.mjs';

function customChallengeInput(){return {title:'Call Discovery Lab',category:'First conversations',level:'Core',duration_minutes:7,description:'Practice a curious, pressure-free opening.',study_cards:[{front:'Before recommending, what do you learn?',back:'Understand the client goal, timing, and priorities before suggesting a property.'}],questions:Array.from({length:3},(_,index)=>({prompt:`A client gives a broad opening request. What is your best next move in scenario ${index+1}?`,options:['Send every available option.','Ask a focused, open question and listen.','Promise the outcome they hope for.','Choose the priority for them.'],answer:1,skill:'discovery',hint:'Clarify the client’s goal first.',explanation:'An open question reveals the client’s own needs before you make a recommendation.'}))};}

test('AI challenge brief accepts English or Egyptian Arabic and defaults safely to English',()=>{
 const brief={title:'Discovery Practice',category:'Client discovery',level:'Core',duration_minutes:8,description:'Ask purposeful questions before recommending.',lesson_notes:'Practice open questions and listening.',round_count:3};
 assert.equal(validateStudioDraftRequest(brief).language,'en');
 assert.equal(validateStudioDraftRequest({...brief,language:'ar-EG'}).language,'ar-EG');
 assert.throws(()=>validateStudioDraftRequest({...brief,language:'fr'}),{status:400});
});

test('AI challenge bilingual validation rejects an empty Egyptian Arabic field',()=>{
 const input=customChallengeInput();
 input.arabic={title:'تدريب اكتشاف احتياجات العميل',category:'فهم احتياج العميل',description:'اتدرّب على الأسئلة المناسبة.'};
 input.questions=input.questions.map(question=>({...question,arabic:{prompt:'العميل محتاج اختيار مناسب. تسأله إيه الأول؟',options:['تبعتله كل الاختيارات.','تسأله سؤال مفتوح وتسمعله.','توعده بحاجة من غير ما تتأكد.','تختارله إنت.'],hint:'اسمع منه الأول.',explanation:'السؤال المفتوح بيوضح احتياج العميل قبل الترشيح.'}}));
 input.study_cards=input.study_cards.map(card=>({...card,arabic:{front:'إيه اللي تعرفه قبل ما ترشّح؟',back:'افهم هدف العميل والوقت والأولويات الأول.'}}));
 const complete=validateStudioChallenge(input);assert.equal(validateStudioArabicChallenge(complete),complete);
 const incomplete={...complete,questions:complete.questions.map((question,index)=>index?question:{...question,arabic:{...question.arabic,prompt:''}})};
 assert.throws(()=>validateStudioArabicChallenge(incomplete),{status:502});
});

test('Academy Studio contains a broad, complete learning pack without leaking facilitator keys',()=>{
 const library=studioLibrary();
 assert.equal(library.length,9);
 assert.equal(new Set(library.map(quiz=>quiz.id)).size,library.length);
 assert.ok(library.every(quiz=>quiz.question_count>=5&&quiz.xp_per_correct===100));
 assert.deepEqual(new Set(library.map(quiz=>quiz.category)),new Set(['Client discovery','Product knowledge','Conversation skills','Client qualification','Professional judgment','Client communication','Client experience','Team collaboration','Market foundations']));
 assert.equal(library.reduce((sum,quiz)=>sum+quiz.question_count,0),49);
 for(const quiz of library){
  const complete=studioQuiz(quiz.id),publicVersion=publicQuiz(complete);
  assert.equal(publicVersion.questions.length,quiz.question_count);
  assert.equal(publicVersion.study_cards.length,3);
  assert.ok(publicVersion.study_cards.every(card=>card.front&&card.back));
  assert.equal(new Set(publicVersion.questions.map(question=>question.id)).size,quiz.question_count);
  assert.ok(publicVersion.questions.every(question=>question.prompt&&question.options.length===4&&question.hint&&typeof question.hint==='string'&&!('answer'in question)&&!('explanation'in question)));
  assert.ok(complete.questions.every(question=>Number.isInteger(question.answer)&&question.answer>=0&&question.answer<question.options.length&&question.explanation.length>35));
  const perfect=gradeStudioQuiz(complete,complete.questions.map(question=>({question_id:question.id,choice:question.answer})));
  assert.equal(perfect.score,100,`${quiz.id} should have a valid correct path`);
  assert.ok(perfect.results.every(question=>question.skill&&question.skill_label&&question.skill_label!=='Practice skills'));
 }
});

test('Practice insights aggregate learner misses privately and recommend an untaken matching challenge',()=>{
 const quiz=studioQuiz('quiz-discovery'),answers=quiz.questions.map(question=>({question_id:question.id,choice:question.id==='d2'?0:question.answer,used_hint:false}));
 const insight=activityPracticeInsights([{trainee_id:'student-1',activity_id:quiz.id,answers}]).get('student-1');
 assert.equal(insight.focus[0].skill,'qualification');assert.equal(insight.focus[0].label,'Client qualification');assert.equal(insight.focus[0].accuracy,0);
 assert.deepEqual(insight.suggested_activity,{id:'quiz-qualification',title:'Needs Decoder'});
 assert.equal(activityPracticeInsights([{trainee_id:'student-2',activity_id:quiz.id,answers:quiz.questions.map(question=>({question_id:question.id,choice:question.answer}))}]).has('student-2'),false);
});

test('Classroom Pulse aggregates completed skill outcomes and suggests a focused next-session challenge',()=>{
 const quiz=studioQuiz('quiz-discovery'),correct=quiz.questions.map(question=>({question_id:question.id,choice:question.answer,used_hint:false}));
 const imperfect=correct.map(answer=>answer.question_id==='d2'?{...answer,choice:(answer.choice+1)%4}:answer);
 const pulse=activityCohortPulse([
  {trainee_id:'private-trainee-a',activity_id:quiz.id,answers:imperfect},
  {trainee_id:'private-trainee-b',activity_id:quiz.id,answers:correct},
  {trainee_id:'incomplete-trainee',activity_id:quiz.id,answers:[]},
  {trainee_id:'unknown-activity',activity_id:'legacy-activity',answers:correct},
 ]);
 assert.equal(pulse.learner_count,2);assert.equal(pulse.submission_count,2);assert.equal(pulse.signal_strength,'Early signal');
 assert.deepEqual(pulse.focus.map(skill=>skill.skill),['qualification']);
 assert.deepEqual(pulse.focus.map(skill=>[skill.correct,skill.attempted,skill.accuracy]),[[1,2,50]]);
 assert.equal(pulse.skills.find(skill=>skill.skill==='qualification').trend,null);
 assert.deepEqual(pulse.recommended_activity,{id:'quiz-qualification',title:'Needs Decoder',category:'Client qualification',duration_minutes:5,is_custom:false});
 assert.ok(!JSON.stringify(pulse).includes('private-trainee-'));
 const allCorrect=activityCohortPulse([{trainee_id:'private-trainee-c',activity_id:quiz.id,answers:correct}]);
 assert.deepEqual(allCorrect.focus,[]);assert.equal(allCorrect.recommended_activity,null);
});

test('Classroom Pulse measures first-to-latest skill change per repeat learner without returning learner identities',()=>{
 const quiz=studioQuiz('quiz-discovery'),answersFor=qualificationCorrect=>quiz.questions.map(question=>({question_id:question.id,choice:question.id==='d2'&&!qualificationCorrect?(question.answer+1)%question.options.length:question.answer,used_hint:false}));
 const pulse=activityCohortPulse([
  {attempt_id:'attempt-a1',trainee_id:'learner-private-a',submitted_at:'2026-10-01T09:00:00.000Z',activity_id:quiz.id,answers:answersFor(false)},
  {attempt_id:'attempt-b1',trainee_id:'learner-private-b',submitted_at:'2026-10-02T09:00:00.000Z',activity_id:quiz.id,answers:answersFor(false)},
  {attempt_id:'attempt-a2',trainee_id:'learner-private-a',submitted_at:'2026-10-08T09:00:00.000Z',activity_id:quiz.id,answers:answersFor(true)},
  {attempt_id:'attempt-b2',trainee_id:'learner-private-b',submitted_at:'2026-10-09T09:00:00.000Z',activity_id:quiz.id,answers:answersFor(false)},
 ]);
 const qualification=pulse.skills.find(skill=>skill.skill==='qualification');
 assert.deepEqual(qualification.trend,{learner_count:2,improved:1,steady:1,declined:0,first_accuracy:0,latest_accuracy:50,delta:50,direction:'up'});
 assert.ok(!JSON.stringify(pulse).includes('learner-private-'));
});

test('Facilitator deck is rich enough for a host while learner surfaces stay answer-key free',()=>{
 const deck=studioFacilitatorDeck(),library=studioLibrary();
 assert.equal(deck.length,library.length+1);
 assert.ok(deck.every(activity=>activity.questions.length>=5&&activity.questions.every(question=>Number.isInteger(question.answer)&&question.explanation)));
 assert.ok(library.every(activity=>!('questions'in activity)&&!('answer'in activity)));
 assert.ok(deck.some(activity=>activity.id==='sequence-sprint'));
 for(const activity of deck.filter(activity=>activity.id!=='sequence-sprint'))for(const question of activity.questions){
  const learner=publicQuiz(studioQuiz(activity.id)).questions.find(row=>row.id===question.id);
  assert.ok(learner);assert.ok(!('answer'in learner));assert.ok(!('explanation'in learner));
 }
});

test('Quiz grading is server-defined, rounds percentages, and returns coaching explanations after completion',()=>{
 const quiz=studioQuiz('quiz-discovery');
 const result=gradeStudioQuiz(quiz,[{question_id:'d1',choice:1},{question_id:'d2',choice:0},{question_id:'d3',choice:1},{question_id:'d4',choice:1},{question_id:'d5',choice:2}]);
 assert.equal(result.score,80);
 assert.equal(result.correct,4);
 assert.equal(result.xp,400);
 assert.equal(result.best_streak,3);
 assert.equal(result.hints_used,0);
 assert.equal(result.results.length,5);
 assert.ok(result.results.every(question=>question.prompt&&question.correct_answer&&question.explanation));
});

test('Quiz grading rejects missing, duplicate, out-of-range and unknown answers',()=>{
 const quiz=studioQuiz('quiz-product');
 for(const answers of [[],[{question_id:'p1',choice:0}],Array.from({length:5},()=>({question_id:'p1',choice:0})),[{question_id:'p1',choice:9},...quiz.questions.slice(1).map(question=>({question_id:question.id,choice:0}))],[...quiz.questions.slice(1).map(question=>({question_id:question.id,choice:0})),{question_id:'unknown',choice:0}]]){
  assert.throws(()=>gradeStudioQuiz(quiz,answers),{status:400});
 }
 assert.throws(()=>gradeStudioQuiz(quiz,[...quiz.questions.map(question=>({question_id:question.id,choice:question.answer})).slice(0,4),{question_id:'p5',choice:quiz.questions[4].answer,used_hint:'yes'}]),{status:400});
});

test('Private quiz draft validation stores only valid partial answers and a valid resume round',()=>{
 const quiz=studioQuiz('quiz-discovery');
 const draft=validateStudioQuizDraft(quiz,[{question_id:'d3',choice:2,used_hint:true},{question_id:'d1',choice:1,used_hint:false}],2);
 assert.deepEqual(draft,{answers:[{question_id:'d1',choice:1,used_hint:false},{question_id:'d3',choice:2,used_hint:true}],current_index:2});
 for(const [answers,index] of [
  [[{question_id:'unknown',choice:0}],0],
  [[{question_id:'d1',choice:8}],0],
  [[{question_id:'d1',choice:0},{question_id:'d1',choice:1}],0],
  [[{question_id:'d1',choice:0,used_hint:'yes'}],0],
  [[],5],
  [Array.from({length:6},(_,i)=>({question_id:`d${(i%5)+1}`,choice:0})),1],
 ])assert.throws(()=>validateStudioQuizDraft(quiz,answers,index),{status:400});
 const custom={id:'studio-draft-test',...validateStudioChallenge(customChallengeInput())};
 assert.deepEqual(validateStudioQuizDraft(custom,[{question_id:'c3',choice:1}],2),{answers:[{question_id:'c3',choice:1,used_hint:false}],current_index:2});
});

test('Optional coaching nudges lower XP without lowering accuracy and survive saved-result replay',()=>{
 const quiz=studioQuiz('quiz-discovery'),answers=quiz.questions.map(question=>({question_id:question.id,choice:question.answer,used_hint:false}));
 const independent=gradeStudioQuiz(quiz,answers);
 assert.equal(independent.score,100);assert.equal(independent.xp,500);
 answers[0].used_hint=true;
 const nudged=gradeStudioQuiz(quiz,answers);
 assert.equal(nudged.score,100);assert.equal(nudged.correct,5);assert.equal(nudged.xp,470);
 assert.equal(nudged.best_streak,5);assert.equal(nudged.hints_used,1);
 assert.equal(nudged.results[0].used_hint,true);assert.equal(nudged.results[0].xp,70);
 assert.deepEqual(gradeStudioQuiz(quiz,nudged.answers),nudged);
});

test('Custom Studio challenges validate, grade by declared skill, and keep their key off learner surfaces',()=>{
 const validated=validateStudioChallenge(customChallengeInput()),challenge={id:'studio-0123456789abcdef0123456789abcdef',...validated,created_by:'trainer@example.test',archived_at:null};
 const publicVersion=publicQuiz(challenge),library=studioLibrary([challenge]),deck=studioFacilitatorDeck([challenge]);
 assert.equal(publicVersion.study_cards.length,1);assert.ok(publicVersion.questions.every(question=>!('answer'in question)&&!('explanation'in question)&&!('skill'in question)));
 assert.ok(library.some(item=>item.id===challenge.id&&item.is_custom&&item.question_count===3));
 assert.equal(deck.find(item=>item.id===challenge.id).questions[0].answer,1);
 const answers=challenge.questions.map((question,index)=>({question_id:question.id,choice:index===0?0:question.answer}));
 const result=gradeStudioQuiz(challenge,answers);assert.equal(result.score,67);assert.equal(result.correct,2);assert.equal(result.results[0].skill,'discovery');assert.equal(result.results[0].skill_label,'Client discovery');
 const insight=activityPracticeInsights([{trainee_id:'custom-learner',activity_id:challenge.id,answers}], [challenge]).get('custom-learner');
 assert.equal(insight.focus[0].skill,'discovery');assert.equal(insight.focus[0].accuracy,67);
 assert.ok(STUDIO_SKILLS.some(skill=>skill.id==='discovery'));
});

test('Custom Egyptian Arabic editions persist across learner and live views without exposing answer keys early',()=>{
 const input=customChallengeInput();
 input.arabic={title:'تدريب مكالمة العميل',category:'أول محادثة',description:'اتدرّب على بداية هادية ومن غير ضغط.'};
 input.questions[0].arabic={prompt:'عميل بدأ بطلب عام. إيه أحسن خطوة؟',options:['ابعتله كل الاختيارات.','اسأله سؤال مفتوح واسمعه.','اوعده بالنتيجة اللي عايزها.','اختار الأولوية مكانه.'],hint:'افهم هدف العميل الأول.',explanation:'السؤال المفتوح يوضّح احتياج العميل قبل الترشيح.'};
 input.study_cards[0].arabic={front:'إيه اللي تعرفه قبل ما ترشّح؟',back:'افهم هدف العميل والميعاد والأولويات الأول.'};
 const validated=validateStudioChallenge(input),challenge={id:'studio-arabic-test',...validated};
 const learner=publicQuiz(challenge),learnerQuestion=learner.questions[0];
 assert.equal(learner.arabic.title,input.arabic.title);
 assert.equal(learnerQuestion.arabic.prompt,input.questions[0].arabic.prompt);
 assert.equal(learnerQuestion.arabic.options[1],input.questions[0].arabic.options[1]);
 assert.equal(learnerQuestion.arabic.hint,input.questions[0].arabic.hint);
 assert.ok(!('explanation'in learnerQuestion.arabic));
 assert.ok(!('answer'in learnerQuestion));
 const hostQuestion=studioFacilitatorDeck([challenge]).find(item=>item.id===challenge.id).questions[0];
 assert.equal(hostQuestion.answer,input.questions[0].answer);
 assert.equal(liveRoomQuestionView(hostQuestion).arabic.explanation,undefined);
 assert.equal(liveRoomQuestionView(hostQuestion,true).arabic.explanation,input.questions[0].arabic.explanation);
 assert.equal(liveRoomQuestionView(hostQuestion,true).answer,input.questions[0].answer);
});

test('Custom challenge validation rejects malformed rounds, duplicate options, invalid skills and unsafe field lengths',()=>{
 const invalid=[];let input=customChallengeInput();input.questions=input.questions.slice(0,2);invalid.push(input);
 input=customChallengeInput();input.questions[0].options[1]=input.questions[0].options[0];invalid.push(input);
 input=customChallengeInput();input.questions[0].answer=4;invalid.push(input);
 input=customChallengeInput();input.questions[0].skill='personality';invalid.push(input);
 input=customChallengeInput();input.questions[0].explanation='short';invalid.push(input);
 input=customChallengeInput();input.study_cards=Array(9).fill(input.study_cards[0]);invalid.push(input);
 input=customChallengeInput();input.title='x'.repeat(81);invalid.push(input);
 for(const payload of invalid)assert.throws(()=>validateStudioChallenge(payload),{status:400});
});
