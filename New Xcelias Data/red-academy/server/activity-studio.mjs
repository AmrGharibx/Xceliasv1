import {ApiError} from './validation.mjs';
import {SEQUENCE_SPRINT_ACTIVITY} from './activity-sequence.mjs';
import {NEW_CAIRO_FOUNDATIONS} from './activity-new-cairo.mjs';

// Answer keys stay on the server. The public library exposes metadata only, and
// the learner endpoint strips both the correct option and the explanation.
const QUIZZES = Object.freeze([
  NEW_CAIRO_FOUNDATIONS,
  {
    id: 'quiz-discovery', title: 'Discovery Sprint', category: 'Client discovery', level: 'Warm-up', duration_minutes: 5,
    description: 'A fast team warm-up for asking better questions before recommending a property.',
    study_cards: [
      {front:'Start with the story',back:'Ask what prompted the move and when the client hopes to move before searching.'},
      {front:'Separate must-haves from preferences',back:'Reflect priorities back in your own words and invite the client to correct you.'},
      {front:'Close the loop',back:'Agree on one useful next step, who owns it, and when you will follow up.'}
    ],
    questions: [
      {id:'d1',prompt:'A client says, "I need a two-bedroom place soon." What is the strongest next move?',options:['Send every two-bedroom listing you have.','Ask what prompted the move and when they need to move.','Start by negotiating the asking price.','Tell them two-bedroom homes are always easy to find.'],answer:1,hint:'Learn why the move matters and when it needs to happen before suggesting listings.',explanation:'Understand the motivation and timeline before searching; it makes the next recommendation relevant.'},
      {id:'d2',prompt:'Which question best checks that you understood a client\'s priorities?',options:['You want the cheapest option, right?','Can I show you our newest launch?','So a short commute is essential, while the balcony is a preference. Is that accurate?','Would you like to reserve today?'],answer:2,hint:'A strong check-back distinguishes a requirement from a preference, then invites correction.',explanation:'Reflecting the requirement back lets the client correct or confirm your understanding.'},
      {id:'d3',prompt:'A client is unsure which area to choose. What is the most useful first question?',options:['Which area is trending online?','Where do you need to travel regularly, and what commute feels manageable?','Which area has the largest buildings?','Would you prefer the project I know best?'],answer:1,hint:'Ground the area discussion in the client\'s real weekly routine.',explanation:'Connect location to the client\'s actual routine rather than making a generic recommendation.'},
      {id:'d4',prompt:'After a viewing, the client becomes quiet. What is a constructive response?',options:['Keep listing features until they react.','Ask what felt right and what did not fit, then listen.','Assume they are not interested and end the conversation.','Offer a discount before asking what they think.'],answer:1,hint:'Use a neutral, open question and give the client room to explain their reaction.',explanation:'An open, neutral debrief reveals the client\'s reaction without pressure.'},
      {id:'d5',prompt:'You are not certain whether a listed feature is included. What should you do?',options:['Give the answer that sounds most likely.','Avoid mentioning the feature.','Say you will verify it from current official information and follow up.','Ask the client to decide what is probably included.'],answer:2,hint:'Be transparent about uncertainty and verify from an approved, current source before confirming.',explanation:'Be transparent about uncertainty and verify details before representing them as fact.'}
    ]
  },
  {
    id: 'quiz-product', title: 'Product Knowledge Check', category: 'Product knowledge', level: 'Core', duration_minutes: 5,
    description: 'A short accuracy mission: verify changing details and explain useful trade-offs.',
    study_cards: [
      {front:'Verify before you promise',back:'Check changing features, prices and availability against the current approved source.'},
      {front:'Compare what matters',back:'Explain verified trade-offs using the client\'s priorities, not a generic ranking.'},
      {front:'Make uncertainty useful',back:'Say what you need to verify and agree a clear time to return with an accurate answer.'}
    ],
    questions: [
      {id:'p1',prompt:'Before sharing a project detail that can change, what is the best practice?',options:['Reuse the last message you sent.','Check the current approved source and note when it was verified.','Ask another client what they heard.','Share it confidently and correct it later if needed.'],answer:1,hint:'Treat changing facts as time-sensitive; check the currently approved source first.',explanation:'Time-sensitive details should be checked against an approved current source.'},
      {id:'p2',prompt:'A feature is available only in some unit types. How should you present it?',options:['Describe it as standard for the whole project.','Explain which unit types include it and verify the specific unit.','Leave out the limitation unless asked.','Assume the client\'s preferred unit includes it.'],answer:1,hint:'Be precise about where the feature applies; do not generalize across the whole project.',explanation:'Be specific about the scope of a feature and verify it for the unit under discussion.'},
      {id:'p3',prompt:'A client asks for a detail you cannot verify during the call. What is the strongest reply?',options:['I do not know; you can search online.','It should be fine.','I want to confirm that accurately; may I check and come back to you by an agreed time?','Move to a different topic and hope it does not come up.'],answer:2,hint:'Name what you will verify and agree on a specific follow-up time.',explanation:'A clear verification step and a promised follow-up preserve trust.'},
      {id:'p4',prompt:'Two properties meet the client\'s budget. How should you compare them?',options:['Recommend the one with the most impressive brochure.','Compare the client\'s stated priorities using verified details and trade-offs.','Choose the one with the highest commission.','Say they are basically the same.'],answer:1,hint:'Use the client\'s own priorities and verified facts to make trade-offs visible.',explanation:'A useful comparison is anchored in the client\'s needs and transparent trade-offs.'},
      {id:'p5',prompt:'Which statement is safest when availability may change?',options:['This unit will definitely be available next week.','Availability changes; I will recheck current inventory before you decide.','It was available when I last checked, so it is yours.','There is no need to verify availability.'],answer:1,hint:'A past availability check is only a snapshot, not a promise about the future.',explanation:'Do not turn a previous availability check into a future guarantee.'}
    ]
  },
  {
    id: 'quiz-objections', title: 'Objection Arena', category: 'Conversation skills', level: 'Challenge', duration_minutes: 6,
    description: 'A scenario challenge: respond calmly, find the real concern, and agree on a next step.',
    study_cards: [
      {front:'Clarify the objection',back:'Ask what the concern means in this situation before choosing a response.'},
      {front:'Stay respectful and evidence-led',back:'Do not invent urgency or criticize another option without reliable evidence.'},
      {front:'Agree the next move',back:'Ask what would help the client decide and confirm a follow-up time and channel.'}
    ],
    questions: [
      {id:'o1',prompt:'A client says, "That feels expensive." What is the best first response?',options:['Tell them prices only go up.','Ask what they are comparing it with and which part feels most important.','Immediately offer a different property.','Explain that they are wrong.'],answer:1,hint:'First clarify what "expensive" means to this client; avoid defending or dismissing it.',explanation:'Clarify the concern before responding; "expensive" can mean several different things.'},
      {id:'o2',prompt:'A client says, "Just send me the details." What can keep the follow-up relevant?',options:['Send every brochure you have.','Ask which one or two details would help them compare.','Ask for a reservation immediately.','Do not send anything.'],answer:1,hint:'Narrow the follow-up to the small amount of information that helps the client decide.',explanation:'A small clarifying question makes the follow-up useful and respects the client\'s time.'},
      {id:'o3',prompt:'A client says, "I need to think about it." What is a respectful next step?',options:['Create urgency even if none is verified.','Ask what question is still unresolved, and offer space to decide.','Keep repeating the offer.','End the conversation without checking what they need.'],answer:1,hint:'Respect their space, while gently inviting any unresolved question—without inventing urgency.',explanation:'Invite the remaining concern without pressuring the client.'},
      {id:'o4',prompt:'The client compares your recommendation to another option. What should you avoid?',options:['Ask what matters most in their comparison.','Clarify which details they want to verify.','Attack the competing option without evidence.','Summarize differences that matter to them.'],answer:2,hint:'Keep the comparison evidence-led and professional; do not criticize without support.',explanation:'Stay evidence-led and professional; unsupported criticism damages trust.'},
      {id:'o5',prompt:'How should you agree on a follow-up after a useful conversation?',options:['Say, "I will call you repeatedly until you answer."','Ask what timing and channel work for them, then confirm the next step.','Leave the next step vague.','Send messages at any hour.'],answer:1,hint:'Agree on a clear next step, including a time and channel that suit the client.',explanation:'A mutually agreed follow-up is clear, respectful, and actionable.'}
    ]
  },
  {
    id: 'quiz-qualification', title: 'Needs Decoder', category: 'Client qualification', level: 'Warm-up', duration_minutes: 5,
    description: 'Turn a broad request into a useful brief without rushing to a recommendation.',
    study_cards: [
      {front:'Start with the outcome',back:'Ask what a successful move or purchase needs to make possible in the client’s life.'},
      {front:'Make the brief usable',back:'Clarify timing, budget comfort, location, and true must-haves one at a time.'},
      {front:'Check before you search',back:'Summarize the priorities and invite a correction before shortlisting options.'}
    ],
    questions: [
      {id:'n1',prompt:'A client says, “I just want a good investment.” What is the most useful first question?',options:['Which project name have you already chosen?','Would you like the most expensive unit?','What outcome matters most to you, and over what time horizon?','Can I promise a strong return?'],answer:2,hint:'“Good” can mean different things. Ask what outcome and time horizon the client means.',explanation:'Clarify the client’s objective and time horizon before comparing options; never promise an investment result.'},
      {id:'n2',prompt:'A client gives a broad budget range. What should you clarify before shortlisting?',options:['Whether that range is comfortable and what costs or constraints they want included.','The maximum number they could possibly borrow.','Whether they can stretch the budget for a better-looking unit.','Nothing; choose the midpoint for them.'],answer:0,hint:'Confirm how the client defines the budget and what they are comfortable considering.',explanation:'A usable budget is the client’s own comfortable range and stated assumptions, not a number the advisor chooses.'},
      {id:'n3',prompt:'A client lists eight preferences. How do you make the search more focused?',options:['Ignore the list and send current inventory.','Choose the preferences you think are realistic.','Ask them to remove everything except one item.','Invite them to separate non-negotiables from preferences, then reflect the shortlist back.'],answer:3,hint:'Help the client prioritize without deciding their priorities for them.',explanation:'Separating must-haves from preferences creates a clearer brief while leaving the decision with the client.'},
      {id:'n4',prompt:'Two people will make the decision, but only one is on the call. What is a respectful next move?',options:['Ask the caller to decide for both of them.','Ask how they would like the other decision-maker included in the next step.','Contact the other person using details found online.','Delay the conversation until both people call together.'],answer:1,hint:'Let the client choose a comfortable, consent-based way to involve the other person.',explanation:'Ask the client how to include the other decision-maker; do not assume authority or contact someone without permission.'},
      {id:'n5',prompt:'You have enough information to search, but one preference is still unclear. What should you do?',options:['Treat it as a must-have without checking.','Search broadly and let the client sort through everything.','Confirm the unclear preference and summarize the agreed brief before searching.','Replace it with a feature you know is popular.'],answer:2,hint:'A brief check-back now can prevent an irrelevant shortlist later.',explanation:'Confirm the open point and reflect the brief back so the search follows the client’s actual criteria.'}
    ]
  },
  {
    id: 'quiz-trust', title: 'Trust & Ethics', category: 'Professional judgment', level: 'Core', duration_minutes: 6,
    description: 'Practice the small decisions that protect client trust when facts, privacy, or pressure are involved.',
    study_cards: [
      {front:'Accuracy beats confidence',back:'Separate verified facts from assumptions. If unsure, say what you will check and when you will return.'},
      {front:'Protect the client’s information',back:'Use client details only for the agreed purpose and approved channels; ask before sharing.'},
      {front:'No invented urgency',back:'Explain genuine constraints only when verified. Give the client space to make an informed choice.'}
    ],
    questions: [
      {id:'t1',prompt:'A client asks whether a feature is included, but your source is unclear. What is the best response?',options:['Say it is probably included because similar units have it.','State that you want to verify the exact unit detail and agree when you will follow up.','Avoid the question and continue the tour.','Say it is included, then correct the answer if needed.'],answer:1,hint:'Be transparent about what is not yet verified and make a specific follow-up commitment.',explanation:'A clear verification step protects accuracy and trust; do not convert uncertainty into a promise.'},
      {id:'t2',prompt:'A colleague asks you to forward a client’s contact details to an outside group. What should guide your response?',options:['Forward them if the group might be useful.','Share only the phone number, not the name.','Send the details after business hours.','Check the client’s permission and the approved purpose and channel before sharing anything.'],answer:3,hint:'Client information is not yours to redistribute just because someone requests it.',explanation:'Confirm permission and follow approved data-handling practice before sharing client information.'},
      {id:'t3',prompt:'A client is hesitating and you hear a colleague suggest saying “only one unit is left,” without a current check. What should you do?',options:['Do not repeat an unverified scarcity claim; check the current source and communicate only what it confirms.','Use the claim because it may help the client decide.','Ask the client to reserve while you verify later.','Say another project has even less availability.'],answer:0,hint:'Urgency claims are facts too; verify them before repeating them.',explanation:'Do not manufacture pressure. Verify current availability and let the client decide using accurate information.'},
      {id:'t4',prompt:'You realize that a detail you shared earlier was incorrect. What is the professional next step?',options:['Wait to see if the client notices.','Quietly edit the message without explaining.','Correct it promptly, explain what changed, and provide the verified detail.','Blame the source and move on.'],answer:2,hint:'Own the correction clearly and promptly; the client needs the accurate information.',explanation:'Promptly correct the record and provide the verified information without shifting blame.'},
      {id:'t5',prompt:'A client asks you to guarantee a future outcome you cannot control. What should you say?',options:['Guarantee it verbally to reassure them.','Explain what is known, what is uncertain, and which approved information can be checked.','Avoid mentioning uncertainty unless they ask again.','Ask them to rely on your experience instead.'],answer:1,hint:'Distinguish current evidence from outcomes no one can guarantee.',explanation:'Be clear about limits and evidence; never promise an outcome outside your control.'}
    ]
  },
  {
    id: 'quiz-followup', title: 'Follow-Through Lab', category: 'Client communication', level: 'Core', duration_minutes: 5,
    description: 'Build follow-ups clients can act on: concise, permission-based, owned, and on time.',
    study_cards: [
      {front:'Recap what matters',back:'Lead with the client’s stated priority and the answer or item they asked you to check.'},
      {front:'Make ownership visible',back:'Name the next action, who owns it, and when the client can expect an update.'},
      {front:'Use the agreed channel',back:'Respect the client’s preferred channel and timing; do not create a message flood.'}
    ],
    questions: [
      {id:'f1',prompt:'You promised to verify two details. Which follow-up is strongest?',options:['A long message with every available brochure.','A brief “checking in” with no update.','A message asking the client to search for the details.','A concise update with each verified answer, the source context, and any remaining open item.'],answer:3,hint:'Deliver the promised information directly and distinguish anything that is still open.',explanation:'A useful follow-up closes the loop on the promised items and is honest about anything still pending.'},
      {id:'f2',prompt:'You cannot get a complete answer by the time you originally expected. What should you do?',options:['Wait until you have the full answer, even if that is much later.','Update the client before the promised time, explain what is pending, and set a realistic next update.','Send a guess so the client is not waiting.','Ask the client to remind you tomorrow.'],answer:1,hint:'The client should hear from you before the commitment expires, even if the answer is not final.',explanation:'Proactive communication preserves trust; give a realistic next update rather than guessing or going silent.'},
      {id:'f3',prompt:'The client says they prefer email and no calls during work hours. What belongs in your follow-up plan?',options:['Call repeatedly until they answer.','Use whichever channel is fastest for you.','Email at an agreed time and ask before changing the channel.','Send the same message through every channel.'],answer:2,hint:'The client has already told you how to make contact respectful and useful.',explanation:'Follow the client’s stated channel and timing preferences; ask before changing them.'},
      {id:'f4',prompt:'A useful update depends on one detail from another team. How do you keep the client informed?',options:['Own the follow-up, coordinate internally, and tell the client when you will update them.','Tell the client to contact the other team directly.','Promise an exact answer before checking with the team.','Close the conversation until the other team responds.'],answer:0,hint:'The client should know who is coordinating the open item and when they will hear from you.',explanation:'Keep ownership of the client-facing loop while coordinating the internal dependency.'},
      {id:'f5',prompt:'The client has not replied to one message. What is the best next step?',options:['Send the same message each hour.','Contact their colleagues to get a response.','Assume they have lost interest and close the record.','Use the agreed cadence and channel for one respectful follow-up, then give them space.'],answer:3,hint:'Follow the agreed cadence; a lack of reply is not permission to escalate contact.',explanation:'Respect the client’s time and contact preferences. A measured follow-up is more professional than repeated pressure.'}
    ]
  },
  {
    id: 'quiz-viewing', title: 'Viewing Debrief', category: 'Client experience', level: 'Core', duration_minutes: 5,
    description: 'Turn a property viewing into a thoughtful conversation instead of a feature monologue.',
    study_cards: [
      {front:'Set the client’s lens',back:'Before the viewing, recall the priorities the client asked you to focus on.'},
      {front:'Notice, then ask',back:'Give the client time to experience the space. Use open questions rather than leading them.'},
      {front:'Debrief without pressure',back:'Explore what fit, what did not, and what the client wants to compare next.'}
    ],
    questions: [
      {id:'v1',prompt:'Before starting a viewing, what is the most useful way to frame the visit?',options:['Recall the client’s stated priorities and ask what they would especially like to assess.','List every feature before they enter.','Tell them which room should matter most.','Ask them to decide before seeing the property.'],answer:0,hint:'Make the visit about the client’s own criteria, not a standard sales script.',explanation:'A brief check-in anchors the visit to the client’s priorities and gives them control of what to explore.'},
      {id:'v2',prompt:'The client pauses in a room and looks around quietly. What should you do?',options:['Fill the silence with more selling points.','Assume they dislike the room and move on.','Give them a moment, then ask an open question about what they notice.','Tell them which layout most buyers prefer.'],answer:2,hint:'A pause can be useful thinking time. Invite the client’s own observation.',explanation:'Space to reflect followed by a neutral question helps the client describe their real reaction.'},
      {id:'v3',prompt:'A client likes one feature but is concerned about a trade-off. What is the strongest response?',options:['Dismiss the concern because the feature is more important.','Acknowledge both points and ask how the trade-off compares with their priorities.','Recommend that they ignore the trade-off.','Switch to a different property without discussing it.'],answer:1,hint:'Help the client weigh the trade-off using their criteria instead of choosing for them.',explanation:'A balanced comparison respects the concern and supports the client’s own decision process.'},
      {id:'v4',prompt:'You are asked about a building detail you have not verified. What should you do during the visit?',options:['Answer from memory if it sounds right.','Say the detail is typical for this type of building.','Promise that it can be changed later.','Explain that you will verify the specific detail and follow up with an accurate answer.'],answer:3,hint:'A viewing is not a reason to lower the standard for accuracy.',explanation:'State the limit of what you know and verify the specific detail before presenting it as fact.'},
      {id:'v5',prompt:'At the end of the viewing, which debrief question is most useful?',options:['What felt right, what did not fit, and what would you like to compare next?','Shall I prepare the paperwork now?','You liked it best, didn’t you?','Can you decide before we leave?'],answer:0,hint:'Invite both positive and negative feedback, then let the client choose the next step.',explanation:'A neutral debrief uncovers fit and concerns without assuming readiness or creating pressure.'}
    ]
  },
  {
    id: 'quiz-handoff', title: 'Team Handoff Relay', category: 'Team collaboration', level: 'Challenge', duration_minutes: 6,
    description: 'Keep service seamless when a teammate, specialist, or next shift takes over.',
    study_cards: [
      {front:'Handoff with context',back:'Share the agreed purpose, verified facts, open questions, and promised next action through approved tools.'},
      {front:'Name one owner',back:'Make it clear who is responsible for the next update and when it is due.'},
      {front:'Close the loop',back:'Confirm the receiving teammate has the handoff and tell the client what to expect.'}
    ],
    questions: [
      {id:'h1',prompt:'You are handing a client conversation to a colleague. What should the handoff include?',options:['Your personal impression of the client’s personality.','Only the client’s phone number.','The client’s stated goal, verified facts, open questions, and agreed next step—shared appropriately.','A guess about which option the client will choose.'],answer:2,hint:'Pass along useful, factual context and the commitment already made, not speculation.',explanation:'A good handoff preserves continuity with relevant verified facts, unresolved items, and a clear next step.'},
      {id:'h2',prompt:'Two teammates believe the other one owns the promised update. How do you prevent a repeat?',options:['Name one owner and a due time in the shared work record, then confirm the handoff.','Ask both to send separate updates.','Wait for the client to follow up.','Add a general note saying “team to handle.”'],answer:0,hint:'Make responsibility explicit; “the team” is not a person who can own a deadline.',explanation:'One named owner and a visible due time prevent the client-facing commitment from falling between teammates.'},
      {id:'h3',prompt:'A client detail is not relevant to the colleague taking over. What should guide whether you share it?',options:['Share everything so the colleague has more context.','Share it if it is interesting.','Include it in a personal chat instead.','Share only what is relevant to the agreed purpose, using an approved channel.'],answer:3,hint:'A handoff should be useful and appropriately limited.',explanation:'Limit shared information to what is relevant and use the organization’s approved channel.'},
      {id:'h4',prompt:'A specialist has not yet confirmed an answer the client is waiting for. What is the best coordination move?',options:['Tell the client the specialist is at fault.','Ask the specialist for a status and realistic timing, then update the client as promised.','Make up a likely answer so the team appears coordinated.','Restart the request with a different team without checking.'],answer:1,hint:'Coordinate the open item and keep the client informed without assigning blame or guessing.',explanation:'A status check plus an honest update maintains ownership while the specialist verifies the answer.'},
      {id:'h5',prompt:'A teammate has taken over the next action. What closes the loop for the client?',options:['No message is needed because the team knows.','Send the client a new introduction without explaining why.','Confirm who will contact them and by when, and make sure the receiving teammate has accepted the handoff.','Ask the client to repeat the whole story to the colleague.'],answer:2,hint:'Continuity means the client understands the next contact and the team has actually accepted the action.',explanation:'Confirm the receiving owner and set the client’s expectation so responsibility is visible on both sides.'}
    ]
  }
]);

const QUIZ_BY_ID = new Map(QUIZZES.map(activity => [activity.id, activity]));

const SKILL_LABELS = Object.freeze({
  discovery: 'Client discovery',
  qualification: 'Client qualification',
  accuracy: 'Product accuracy',
  objections: 'Objection handling',
  ethics: 'Ethical judgment',
  followthrough: 'Follow-through',
  viewing: 'Viewing conversations',
  teamwork: 'Team handoffs',
});

const QUESTION_SKILLS = Object.freeze({
  'quiz-discovery': Object.freeze({d1:'discovery',d2:'qualification',d3:'discovery',d4:'viewing',d5:'accuracy'}),
  'quiz-product': Object.freeze({p1:'accuracy',p2:'accuracy',p3:'followthrough',p4:'discovery',p5:'accuracy'}),
  'quiz-objections': Object.freeze({o1:'objections',o2:'followthrough',o3:'ethics',o4:'ethics',o5:'followthrough'}),
  'quiz-qualification': Object.freeze({n1:'discovery',n2:'qualification',n3:'qualification',n4:'qualification',n5:'qualification'}),
  'quiz-trust': Object.freeze({t1:'accuracy',t2:'ethics',t3:'ethics',t4:'ethics',t5:'accuracy'}),
  'quiz-followup': Object.freeze({f1:'followthrough',f2:'followthrough',f3:'followthrough',f4:'teamwork',f5:'ethics'}),
  'quiz-viewing': Object.freeze({v1:'viewing',v2:'viewing',v3:'viewing',v4:'accuracy',v5:'viewing'}),
  'quiz-handoff': Object.freeze({h1:'teamwork',h2:'teamwork',h3:'ethics',h4:'followthrough',h5:'teamwork'}),
});

export const STUDIO_SKILLS = Object.freeze(Object.entries(SKILL_LABELS).map(([id,label])=>Object.freeze({id,label})));

const cleanChallengeText=(value,max,label,{required=true,min=1}={})=>{
  if(typeof value!=='string')throw new ApiError(400,`Enter valid ${label}.`);
  const text=value.trim();
  if((required&&text.length<min)||text.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))throw new ApiError(400,`Enter ${label} using ${min} to ${max} characters.`);
  return text;
};
const optionalArabicText=(value,max,label)=>value===undefined?'':cleanChallengeText(value,max,label,{required:false});

export function validateStudioDraftRequest(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new ApiError(400,'Enter a valid challenge brief.');
  const language=input.language===undefined?'en':input.language;
  if(!['en','ar-EG'].includes(language))throw new ApiError(400,'Choose English or Egyptian Arabic for the challenge draft.');
  const title=cleanChallengeText(input.title,80,'a challenge title',{min:3});
  const category=cleanChallengeText(input.category,60,'a learning focus',{min:2});
  const description=cleanChallengeText(input.description??'',280,'a challenge briefing',{required:false});
  const lessonNotes=cleanChallengeText(input.lesson_notes??'',2400,'lesson notes',{required:false});
  if(!['Warm-up','Core','Challenge'].includes(input.level))throw new ApiError(400,'Choose a valid challenge level.');
  if(!Number.isInteger(input.duration_minutes)||input.duration_minutes<2||input.duration_minutes>45)throw new ApiError(400,'Set an estimated duration between 2 and 45 minutes.');
  if(!Number.isInteger(input.round_count)||input.round_count<3||input.round_count>12)throw new ApiError(400,'Choose between 3 and 12 challenge rounds.');
  const aiText=[title,category,description,lessonNotes].join('\n');
  if(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(aiText)||/(?:\+?\d[\d\s().-]{7,}\d)/.test(aiText))throw new ApiError(400,'Remove personal contact details from the challenge brief and lesson notes before using the AI draft assistant.');
  return {title,category,description,lesson_notes:lessonNotes,level:input.level,duration_minutes:input.duration_minutes,round_count:input.round_count,language};
}

// Custom challenges are immutable once saved. Their private key is stored only
// with server-side data, and learner-facing serialization always strips it.
export function validateStudioChallenge(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new ApiError(400,'Enter a valid custom challenge.');
  const title=cleanChallengeText(input.title,80,'a challenge title',{min:3});
  const category=cleanChallengeText(input.category,60,'a learning focus',{min:2});
  const description=cleanChallengeText(input.description??'',280,'a challenge briefing',{required:false});
  const arabicInput=input.arabic??{};
  if(!arabicInput||typeof arabicInput!=='object'||Array.isArray(arabicInput))throw new ApiError(400,'Enter a valid Egyptian Arabic challenge edition.');
  if(!['Warm-up','Core','Challenge'].includes(input.level))throw new ApiError(400,'Choose a valid challenge level.');
  if(!Number.isInteger(input.duration_minutes)||input.duration_minutes<2||input.duration_minutes>45)throw new ApiError(400,'Set an estimated duration between 2 and 45 minutes.');
  if(!Array.isArray(input.questions)||input.questions.length<3||input.questions.length>12)throw new ApiError(400,'Add between 3 and 12 question rounds.');
  const questions=input.questions.map((question,index)=>{
    if(!question||typeof question!=='object'||Array.isArray(question))throw new ApiError(400,`Complete round ${index+1}.`);
    const prompt=cleanChallengeText(question.prompt,500,`the round ${index+1} scenario`,{min:8});
    if(!Array.isArray(question.options)||question.options.length!==4)throw new ApiError(400,`Round ${index+1} needs exactly four answer choices.`);
    const options=question.options.map((option,optionIndex)=>cleanChallengeText(option,180,`choice ${String.fromCharCode(65+optionIndex)} in round ${index+1}`,{min:1}));
    if(new Set(options.map(option=>option.toLocaleLowerCase())).size!==options.length)throw new ApiError(400,`Round ${index+1} needs four different answer choices.`);
    if(!Number.isInteger(question.answer)||question.answer<0||question.answer>3)throw new ApiError(400,`Choose the correct answer for round ${index+1}.`);
    const skill=typeof question.skill==='string'?question.skill:'';
    if(!Object.hasOwn(SKILL_LABELS,skill))throw new ApiError(400,`Choose a learning skill for round ${index+1}.`);
    const arabic=question.arabic??{};
    if(!arabic||typeof arabic!=='object'||Array.isArray(arabic))throw new ApiError(400,`Enter a valid Egyptian Arabic edition for round ${index+1}.`);
    if(arabic.options!==undefined&&(!Array.isArray(arabic.options)||arabic.options.length!==4))throw new ApiError(400,`The Egyptian Arabic edition for round ${index+1} needs four answer choices.`);
    const translated={prompt:optionalArabicText(arabic.prompt,500,`the Egyptian Arabic prompt for round ${index+1}`),options:(arabic.options||[]).map((option,optionIndex)=>optionalArabicText(option,180,`Egyptian Arabic choice ${String.fromCharCode(65+optionIndex)} in round ${index+1}`)),hint:optionalArabicText(arabic.hint,280,`the Egyptian Arabic coaching nudge for round ${index+1}`),explanation:optionalArabicText(arabic.explanation,700,`the Egyptian Arabic coaching takeaway for round ${index+1}`)};
    const result={id:`c${index+1}`,prompt,options,answer:question.answer,skill,hint:cleanChallengeText(question.hint??'',280,`the round ${index+1} coaching nudge`,{required:false}),explanation:cleanChallengeText(question.explanation,700,`the round ${index+1} coaching takeaway`,{min:12})};
    if(translated.prompt||translated.options.some(Boolean)||translated.hint||translated.explanation)result.arabic=translated;
    return result;
  });
  if(!Array.isArray(input.study_cards)||input.study_cards.length>8)throw new ApiError(400,'Add no more than eight optional recall cards.');
  const study_cards=input.study_cards.map((card,index)=>{
    if(!card||typeof card!=='object'||Array.isArray(card))throw new ApiError(400,`Complete recall card ${index+1}.`);
    const arabic=card.arabic??{};
    if(!arabic||typeof arabic!=='object'||Array.isArray(arabic))throw new ApiError(400,`Enter a valid Egyptian Arabic edition for recall card ${index+1}.`);
    const translated={front:optionalArabicText(arabic.front,140,`Egyptian Arabic recall card ${index+1} prompt`),back:optionalArabicText(arabic.back,500,`Egyptian Arabic recall card ${index+1} takeaway`)};
    const result={front:cleanChallengeText(card.front,140,`recall card ${index+1} prompt`,{min:3}),back:cleanChallengeText(card.back,500,`recall card ${index+1} takeaway`,{min:8})};
    if(translated.front||translated.back)result.arabic=translated;
    return result;
  });
  const arabic={title:optionalArabicText(arabicInput.title,80,'the Egyptian Arabic challenge title'),category:optionalArabicText(arabicInput.category,60,'the Egyptian Arabic learning focus'),description:optionalArabicText(arabicInput.description,280,'the Egyptian Arabic challenge briefing')};
  const result={title,category,level:input.level,duration_minutes:input.duration_minutes,description,study_cards,questions};
  if(Object.values(arabic).some(Boolean))result.arabic=arabic;
  return result;
}

// AI-created challenges always carry both editions. Manual authoring remains
// optional, but the AI route must not publish an empty or English-only Arabic
// side and call it bilingual.
export function validateStudioArabicChallenge(challenge){
  const hasArabic=value=>typeof value==='string'&&/[\u0600-\u06ff]/.test(value);
  const contact=/(?:\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)|(?:\+?\d[\d\s().-]{7,}\d)/i;
  const pairs=[[challenge?.title,challenge?.arabic?.title],[challenge?.category,challenge?.arabic?.category],[challenge?.description,challenge?.arabic?.description]];
  for(const question of challenge?.questions||[]){
    pairs.push([question.prompt,question.arabic?.prompt],[question.hint,question.arabic?.hint],[question.explanation,question.arabic?.explanation]);
    question.options.forEach((option,index)=>pairs.push([option,question.arabic?.options?.[index]]));
  }
  for(const card of challenge?.study_cards||[])pairs.push([card.front,card.arabic?.front],[card.back,card.arabic?.back]);
  if(pairs.some(([english,arabic])=>(english||'').trim()&&!hasArabic(arabic)))throw new ApiError(502,'The AI provider did not provide a complete Egyptian Arabic edition. No challenge draft was saved.');
  if(pairs.some(([english,arabic])=>contact.test(`${english||''}\n${arabic||''}`)))throw new ApiError(502,'The AI provider returned contact details. No challenge draft was saved.');
  return challenge;
}

export function studioLibrary(customActivities=[]) {
  const builtIn=QUIZZES.map(({id,title,category,level,duration_minutes,description,questions,arabic}) => ({id,title,category,level,duration_minutes,description,...(arabic?{arabic}:{}),question_count:questions.length,xp_per_correct:100}));
  const custom=customActivities.filter(activity=>!activity.archived_at).map(({id,title,category,level,duration_minutes,description,arabic,questions,created_by})=>({id,title,category,level,duration_minutes,description,...(arabic?{arabic}:{}),question_count:questions.length,xp_per_correct:100,is_custom:true,created_by}));
  return [...builtIn,...custom];
}

export function studioQuiz(id,customActivities=[]) {
  return QUIZ_BY_ID.get(id) || customActivities.find(activity=>activity.id===id) || null;
}

// Use only behind the staff-writer facilitator endpoint. Public learner and
// assignment libraries must continue using studioLibrary/publicQuiz instead.
export function studioFacilitatorDeck(customActivities=[]) {
  const builtIn=QUIZZES.map(({id,title,category,level,duration_minutes,questions,arabic}) => ({
    id,title,category,level,duration_minutes,...(arabic?{arabic}:{}),
    questions:questions.map(({id:questionId,prompt,options,answer,explanation,arabic:arabicQuestion}) => ({id:questionId,prompt,options,answer,explanation,...(arabicQuestion?{arabic:arabicQuestion}:{})}))
  }));
  const custom=customActivities.filter(activity=>!activity.archived_at).map(({id,title,category,level,duration_minutes,arabic,questions})=>({id,title,category,level,duration_minutes,...(arabic?{arabic}:{}),questions:questions.map(({id:questionId,prompt,options,answer,explanation,arabic:arabicQuestion})=>({id:questionId,prompt,options,answer,explanation,...(arabicQuestion?{arabic:arabicQuestion}:{})}))}));
  return [...builtIn,...custom,SEQUENCE_SPRINT_ACTIVITY];
}

// The phone and host projections deliberately omit the six internal scoring
// slots for a sequence puzzle. Only the steps are public before reveal.
export function liveRoomQuestionView(question,revealed=false) {
  const view={id:question.id,prompt:question.prompt};
  if(question.type==='sequence')Object.assign(view,{type:'sequence',steps:[...question.steps]});
  else view.options=question.options;
  if(question.arabic)Object.assign(view,{arabic:{prompt:question.arabic.prompt,options:question.arabic.options,hint:question.arabic.hint}});
  if(revealed){Object.assign(view,{answer:question.answer,explanation:question.explanation});if(question.arabic?.explanation)view.arabic={...(view.arabic||{}),explanation:question.arabic.explanation};}
  return view;
}

export function publicQuiz(activity) {
  if (!activity) return null;
  return {id:activity.id,title:activity.title,category:activity.category,level:activity.level,duration_minutes:activity.duration_minutes,...(activity.arabic?{arabic:activity.arabic}:{}),study_cards:(activity.study_cards||[]).map(({front,back,arabic})=>({front,back,...(arabic?{arabic}:{})})),questions:activity.questions.map(({id,prompt,options,hint,arabic}) => ({id,prompt,options,hint,...(arabic?{arabic:{prompt:arabic.prompt,options:arabic.options,hint:arabic.hint}}:{})}))};
}

// Derived only for writable staff views. Raw learner answers stay private; the
// trainer receives a small-sample practice signal and a relevant next challenge.
export function activityPracticeInsights(attempts,customActivities=[]) {
  const customById=new Map(customActivities.map(activity=>[activity.id,activity]));
  const byTrainee = new Map();
  for (const attempt of attempts || []) {
    const activity = studioQuiz(attempt.activity_id,customActivities)||customById.get(attempt.activity_id);
    if (!activity || !Array.isArray(attempt.answers) || !attempt.answers.length) continue;
    let graded;
    try { graded = gradeStudioQuiz(activity, attempt.answers); } catch { continue; }
    const progress = byTrainee.get(attempt.trainee_id) || {skills:new Map(),completed:new Set()};
    progress.completed.add(activity.id);
    for (const result of graded.results) {
      const row = progress.skills.get(result.skill) || {attempted:0,correct:0};
      row.attempted++;
      if (result.correct) row.correct++;
      progress.skills.set(result.skill,row);
    }
    byTrainee.set(attempt.trainee_id,progress);
  }

  const insights = new Map();
  for (const [traineeId,progress] of byTrainee) {
    const focus = [...progress.skills].map(([skill,row])=>({skill,label:SKILL_LABELS[skill]||'Practice skills',attempted:row.attempted,correct:row.correct,missed:row.attempted-row.correct,accuracy:Math.round(row.correct/row.attempted*100)}))
      .filter(row=>row.missed>0).sort((a,b)=>a.accuracy-b.accuracy||b.missed-a.missed||a.label.localeCompare(b.label)).slice(0,2);
    if (!focus.length) continue;
    const weakSkills=new Set(focus.map(row=>row.skill));
    const candidates=QUIZZES.map(activity=>({activity,overlap:activity.questions.reduce((sum,question)=>sum+(weakSkills.has(QUESTION_SKILLS[activity.id]?.[question.id])?1:0),0),alreadyCompleted:progress.completed.has(activity.id)}))
      .filter(row=>row.overlap>0).sort((a,b)=>Number(a.alreadyCompleted)-Number(b.alreadyCompleted)||b.overlap-a.overlap||a.activity.duration_minutes-b.activity.duration_minutes||a.activity.title.localeCompare(b.activity.title));
    const suggestion=candidates[0]?.activity;
    insights.set(traineeId,{focus,suggested_activity:suggestion?{id:suggestion.id,title:suggestion.title}:null,completed_challenges:progress.completed.size});
  }
  return insights;
}

// Build a next-session signal from completed, server-graded submissions. The
// result contains cohort aggregates only: no learner identifiers, names, or
// answer-level details cross back to the browser.
export function activityCohortPulse(attempts,customActivities=[]) {
  const learners=new Set(),completedActivities=new Set(),totals=new Map(),historyBySkill=new Map();
  let submissionCount=0;
  for(const attempt of attempts||[]){
    const activity=studioQuiz(attempt.activity_id,customActivities);
    if(!activity||!Array.isArray(attempt.answers)||!attempt.answers.length)continue;
    let graded;
    try{graded=gradeStudioQuiz(activity,attempt.answers);}catch{continue;}
    submissionCount++;
    if(typeof attempt.trainee_id==='string')learners.add(attempt.trainee_id);
    completedActivities.add(activity.id);
    const skillAttempt=new Map();
    for(const result of graded.results){
      const row=totals.get(result.skill)||{skill:result.skill,label:result.skill_label,attempted:0,correct:0,learners:new Set()};
      row.attempted++;if(result.correct)row.correct++;
      if(typeof attempt.trainee_id==='string')row.learners.add(attempt.trainee_id);
      totals.set(result.skill,row);
      const attemptSkill=skillAttempt.get(result.skill)||{label:result.skill_label,attempted:0,correct:0};
      attemptSkill.attempted++;if(result.correct)attemptSkill.correct++;
      skillAttempt.set(result.skill,attemptSkill);
    }
    const at=Date.parse(attempt.submitted_at);
    if(typeof attempt.trainee_id==='string'&&Number.isFinite(at)){
      for(const [skill,result] of skillAttempt){
        const byLearner=historyBySkill.get(skill)||new Map(),history=byLearner.get(attempt.trainee_id)||[];
        history.push({at,attempt_id:String(attempt.attempt_id||''),accuracy:Math.round(result.correct/result.attempted*100)});
        byLearner.set(attempt.trainee_id,history);historyBySkill.set(skill,byLearner);
      }
    }
  }
  const skills=[...totals.values()].map(({learners:skillLearners,...row})=>{
    const latest=[],paired=[];
    for(const history of historyBySkill.get(row.skill)?.values()||[]){
      const ordered=history.slice().sort((a,b)=>a.at-b.at||a.attempt_id.localeCompare(b.attempt_id));
      if(ordered.length)latest.push(ordered.at(-1).accuracy);
      if(ordered.length>=2&&ordered[0].at<ordered.at(-1).at)paired.push({first:ordered[0].accuracy,last:ordered.at(-1).accuracy});
    }
    const mean=values=>Math.round(values.reduce((sum,value)=>sum+value,0)/values.length);
    const trend=paired.length?{
      learner_count:paired.length,
      improved:paired.filter(pair=>pair.last>pair.first).length,
      steady:paired.filter(pair=>pair.last===pair.first).length,
      declined:paired.filter(pair=>pair.last<pair.first).length,
      first_accuracy:mean(paired.map(pair=>pair.first)),
      latest_accuracy:mean(paired.map(pair=>pair.last)),
      delta:mean(paired.map(pair=>pair.last-pair.first)),
    }:null;
    if(trend)trend.direction=trend.delta>=8?'up':trend.delta<=-8?'down':'steady';
    return {...row,learner_count:skillLearners.size,accuracy:Math.round(row.correct/row.attempted*100),latest_accuracy:latest.length?mean(latest):null,trend};
  }).sort((a,b)=>a.accuracy-b.accuracy||b.attempted-a.attempted||a.label.localeCompare(b.label));
  const focus=skills.filter(row=>row.correct<row.attempted).slice(0,2);
  let recommendedActivity=null;
  if(focus.length){
    const focusBySkill=new Map(focus.map(row=>[row.skill,row.missed]));
    const customAvailable=customActivities.filter(activity=>!activity.archived_at);
    const pool=[...QUIZZES,...customAvailable];
    const candidates=pool.map(activity=>{
      const covered=new Set(activity.questions.map(question=>question.skill||QUESTION_SKILLS[activity.id]?.[question.id]).filter(skill=>focusBySkill.has(skill)));
      const coverage=covered.size,misses=[...covered].reduce((sum,skill)=>sum+(focusBySkill.get(skill)||0),0);
      return {activity,coverage,misses,alreadyUsed:completedActivities.has(activity.id)};
    }).filter(candidate=>candidate.coverage>0)
      .sort((a,b)=>b.coverage-a.coverage||b.misses-a.misses||Number(a.alreadyUsed)-Number(b.alreadyUsed)||a.activity.duration_minutes-b.activity.duration_minutes||a.activity.title.localeCompare(b.activity.title));
    const chosen=candidates[0]?.activity;
    if(chosen)recommendedActivity={id:chosen.id,title:chosen.title,category:chosen.category,duration_minutes:chosen.duration_minutes,is_custom:!!chosen.created_by};
  }
  return {
    learner_count:learners.size,
    submission_count:submissionCount,
    skills,
    focus,
    signal_strength:learners.size>=8?'Class trend':learners.size>=3?'Emerging pattern':'Early signal',
    recommended_activity:recommendedActivity,
  };
}

export function gradeStudioQuiz(activity,answers) {
  if (!activity || !Array.isArray(answers) || answers.length !== activity.questions.length) throw new ApiError(400,'Answer every quiz question before submitting.');
  const byId = new Map();
  for (const answer of answers) {
    if (!answer || typeof answer.question_id !== 'string' || !Number.isInteger(answer.choice) || (answer.used_hint !== undefined && typeof answer.used_hint !== 'boolean') || byId.has(answer.question_id)) throw new ApiError(400,'The submitted quiz answers are invalid.');
    byId.set(answer.question_id,{choice:answer.choice,used_hint:answer.used_hint===true});
  }
  const results = activity.questions.map(question => {
    const submitted = byId.get(question.id),choice = submitted?.choice;
    if (!Number.isInteger(choice) || choice < 0 || choice >= question.options.length) throw new ApiError(400,'The submitted quiz answers are invalid.');
    const correct=choice===question.answer,used_hint=submitted.used_hint;
    const skill=question.skill||QUESTION_SKILLS[activity.id]?.[question.id]||'discovery';
    const result={question_id:question.id,prompt:question.prompt,choice,correct,used_hint,xp:correct?(used_hint?70:100):0,skill,skill_label:SKILL_LABELS[skill]||'Practice skills',correct_answer:question.options[question.answer],explanation:question.explanation};
    if(question.arabic?.explanation||question.arabic?.options?.[question.answer])result.arabic={...(question.arabic?.explanation?{explanation:question.arabic.explanation}:{}),...(question.arabic?.options?.[question.answer]?{correct_answer:question.arabic.options[question.answer]}:{})};
    return result;
  });
  if (byId.size !== activity.questions.length) throw new ApiError(400,'The submitted quiz answers are invalid.');
  const correct = results.filter(result => result.correct).length;
  let streak=0,best_streak=0;
  for(const result of results){streak=result.correct?streak+1:0;best_streak=Math.max(best_streak,streak);}
  const skillTotals=new Map();
  for(const result of results){const row=skillTotals.get(result.skill)||{skill:result.skill,label:result.skill_label,attempted:0,correct:0};row.attempted++;if(result.correct)row.correct++;skillTotals.set(result.skill,row);}
  const skill_summary=[...skillTotals.values()].map(row=>({...row,accuracy:Math.round(row.correct/row.attempted*100)})).sort((a,b)=>a.accuracy-b.accuracy||a.label.localeCompare(b.label));
  return {answers:results.map(({question_id,choice,used_hint})=>({question_id,choice,used_hint})),results,skill_summary,correct,total:activity.questions.length,score:Math.round(correct/activity.questions.length*100),xp:results.reduce((sum,result)=>sum+result.xp,0),best_streak,hints_used:results.filter(result=>result.used_hint).length};
}

export function validateStudioQuizDraft(activity,answers,currentIndex) {
  if(!activity||!Array.isArray(answers)||answers.length>activity.questions.length||!Number.isInteger(currentIndex)||currentIndex<0||currentIndex>=activity.questions.length)throw new ApiError(400,'Saved quiz progress is invalid.');
  const questions=new Map(activity.questions.map(question=>[question.id,question])),byId=new Map();
  for(const answer of answers){
    if(!answer||typeof answer.question_id!=='string'||!Number.isInteger(answer.choice)||(answer.used_hint!==undefined&&typeof answer.used_hint!=='boolean')||byId.has(answer.question_id))throw new ApiError(400,'Saved quiz progress is invalid.');
    const question=questions.get(answer.question_id);
    if(!question||answer.choice<0||answer.choice>=question.options.length)throw new ApiError(400,'Saved quiz progress is invalid.');
    byId.set(answer.question_id,{question_id:question.id,choice:answer.choice,used_hint:answer.used_hint===true});
  }
  return {answers:activity.questions.filter(question=>byId.has(question.id)).map(question=>byId.get(question.id)),current_index:currentIndex};
}
