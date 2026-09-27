export const ROLEPLAY_SCENARIOS=Object.freeze([
 {
  id:'six-week-move',title:'The six-week move',skill:'Client discovery',level:'Warm-up',
  setup:'A new client asks for a two-bedroom home “soon.” Your trainee is the advisor; you are the client. Keep the conversation curious before anyone opens a listing.',
  trainerBrief:'You are relocating for a new job. Your lease ends in six weeks, but your current landlord may offer a short extension. You need a predictable commute; your partner values a quieter area. Do not volunteer these details unless the advisor asks.',
  turns:[
   {clientLine:'I need a two-bedroom home soon. What do you have?',coachCue:'Listen for a question about why the move matters and what “soon” means before a recommendation.'},
   {clientLine:'My lease ends in six weeks, but I might be able to extend it.',coachCue:'Listen for a calm clarification of timing, flexibility, and who is involved in the decision.'},
   {clientLine:'My partner cares about the commute. I care more about a quiet area.',coachCue:'Listen for a check-back that captures both priorities without choosing for the clients.'}
  ],
  lookFors:[{id:'motivation',label:'Finds the reason behind the request'},{id:'timing',label:'Clarifies the real timeline and flexibility'},{id:'reflect',label:'Reflects both decision-makers’ priorities'}],
  avoid:'Jumping straight to listings, assuming “soon” has one meaning, or treating one partner’s preference as the shared brief.',
  model:'“I can help narrow this down. What makes the timing important, and how flexible could the move be? Then we can compare the commute and quieter-area priorities together.”',
  debrief:'Which question changed the quality of the brief before the advisor recommended anything?'
 },
 {
  id:'price-objection',title:'“That feels expensive”',skill:'Conversation skills',level:'Core',
  setup:'The client reacts to a price with hesitation. The advisor’s job is to understand the comparison, not defend the price or manufacture urgency.',
  trainerBrief:'You compared one smaller unit nearby and are unsure whether the extra space is worth the difference. You dislike pressure and want a clear comparison.',
  turns:[
   {clientLine:'Honestly, that feels expensive for what it is.',coachCue:'Listen for a neutral question that clarifies what “expensive” means to this client.'},
   {clientLine:'A similar place nearby costs less, but it is smaller.',coachCue:'Listen for a client-led comparison across verified, relevant trade-offs.'},
   {clientLine:'I do not want to rush into a decision today.',coachCue:'Listen for respect for the client’s pace and a useful, optional next step.'}
  ],
  lookFors:[{id:'clarify',label:'Clarifies the comparison without getting defensive'},{id:'evidence',label:'Compares verified trade-offs that matter'},{id:'choice',label:'Leaves the decision and pace with the client'}],
  avoid:'Saying prices always rise, dismissing the concern, inventing scarcity, or pushing for a reservation.',
  model:'“That makes sense to compare. Which part feels furthest from what you expected? We can look at the verified differences together, and there is no need to decide today.”',
  debrief:'What changed when the advisor explored the concern instead of trying to overcome it?'
 },
 {
  id:'verify-before-you-promise',title:'Verify before you promise',skill:'Accuracy & trust',level:'Core',
  setup:'A client asks about a feature that may vary by unit or handover stage. Practice being useful while clearly separating what is known from what still needs checking.',
  trainerBrief:'You are considering a specific unit and want to know whether the pool will be ready at handover. The advisor does not have a current approved source in front of them.',
  turns:[
   {clientLine:'Will the pool definitely be ready by handover?',coachCue:'Listen for a transparent answer that does not turn uncertainty into a promise.'},
   {clientLine:'Can you just tell me what you think?',coachCue:'Listen for a clear verification source and a realistic follow-up commitment.'},
   {clientLine:'That works. What should I expect next?',coachCue:'Listen for a specific owner, action, and time for the follow-up.'}
  ],
  lookFors:[{id:'truth',label:'Names what is not yet verified'},{id:'source',label:'Commits to an approved current source'},{id:'followup',label:'Agrees who will follow up and when'}],
  avoid:'Guessing, relying on an old message, promising an outcome, or leaving the follow-up vague.',
  model:'“I do not want to guess about a handover detail. I’ll check the latest approved schedule for this unit and come back to you by 3 pm tomorrow.”',
  debrief:'How can a clear verification promise increase trust without pretending to know the answer?'
 },
 {
  id:'quiet-viewing',title:'The quiet viewing',skill:'Viewing debrief',level:'Warm-up',
  setup:'A client goes quiet after a viewing. Practice making room for an honest reaction rather than filling the silence with more selling points.',
  trainerBrief:'You liked the natural light but the commute may be harder than expected. You are still processing and do not want the advisor to decide for you.',
  turns:[
   {clientLine:'It is nice, I guess.',coachCue:'Listen for an open, neutral invitation to share what felt right or wrong.'},
   {clientLine:'The commute might be harder than we thought.',coachCue:'Listen for a follow-up about the client’s real routine and acceptable trade-offs.'},
   {clientLine:'The light was great, though. I am not sure how to weigh that.',coachCue:'Listen for a balanced summary that leaves the priorities with the client.'}
  ],
  lookFors:[{id:'space',label:'Leaves room for the client’s real reaction'},{id:'routine',label:'Connects the concern to the client’s routine'},{id:'balance',label:'Summarizes trade-offs without choosing for them'}],
  avoid:'Treating silence as agreement, listing more features, or dismissing the commute concern.',
  model:'“What felt like the best fit, and what gave you pause? We can compare those against the routine you described.”',
  debrief:'Which question helped the client move from a vague reaction to a decision criterion?'
 },
 {
  id:'follow-up-permission',title:'A follow-up that fits',skill:'Client communication',level:'Core',
  setup:'A client asks for information but has not agreed to another call. Practice a concise, permission-based next step that respects their preferred channel and timing.',
  trainerBrief:'You want the current floor plan and an accurate service-charge figure. You are busy during the day and prefer one concise email. Do not volunteer contact details; they are already on the company record.',
  turns:[
   {clientLine:'Could you send me the details?',coachCue:'Listen for one short question that makes the follow-up relevant rather than sending everything.'},
   {clientLine:'The floor plan and the current service-charge figure would help.',coachCue:'Listen for an agreed channel, ownership, and a realistic time.'},
   {clientLine:'Email is best. I am usually free after work if you need to talk.',coachCue:'Listen for confirmation without creating extra contact or pressure.'}
  ],
  lookFors:[{id:'scope',label:'Narrows the follow-up to what the client asked for'},{id:'permission',label:'Uses the client’s preferred channel'},{id:'owner',label:'Confirms an owner and a realistic time'}],
  avoid:'Sending a pile of brochures, contacting the client repeatedly, or using personal information for an unagreed purpose.',
  model:'“I’ll verify the current figure and email that with the floor plan by 4 pm tomorrow. Would that timing work?”',
  debrief:'What made the follow-up specific without making it feel pushy?'
 },
 {
  id:'clean-handoff',title:'The clean handoff',skill:'Teamwork',level:'Challenge',
  setup:'A teammate is taking over a conversation. Practice restoring confidence, asking permission, and handing over only the context the client needs.',
  trainerBrief:'You already explained your needs to another advisor and are frustrated about repeating yourself. You agreed that the team may share your stated preferences, but you do not want unrelated personal details repeated.',
  turns:[
   {clientLine:'I already explained all this to the last person.',coachCue:'Listen for acknowledgement and ownership rather than blame or defensiveness.'},
   {clientLine:'I need a shorter commute, but I do not want to repeat my whole story.',coachCue:'Listen for consent-based confirmation of only the useful context.'},
   {clientLine:'Okay, what happens next?',coachCue:'Listen for a clear owner and a next step that closes the loop.'}
  ],
  lookFors:[{id:'acknowledge',label:'Acknowledges the repeated effort and takes ownership'},{id:'consent',label:'Confirms only relevant, agreed context'},{id:'close',label:'Names the next owner and action'}],
  avoid:'Blaming the colleague, repeating unnecessary personal information, or leaving the client unsure who owns the next step.',
  model:'“You should not have to start over. With your permission, I’ll confirm the commute priority with you and make sure the next advisor has only that agreed context.”',
  debrief:'What would make this handoff feel like continuity to the client instead of another reset?'
 },
 {
  id:'investment-evidence',title:'The return question',skill:'Investment evidence',level:'Challenge',
  setup:'A prospect asks for a guaranteed investment return. Practise being useful without turning a projection or old brochure into a promise.',
  trainerBrief:'You are comparing two units and want a clear basis for the decision. The advisor has no current, unit-specific rental evidence open. You are wary of sales language and want to review the assumptions yourself.',
  turns:[
   {clientLine:'What return can you guarantee me on this unit?',coachCue:'Listen for an honest boundary: do not guarantee a future financial outcome.'},
   {clientLine:'The brochure mentions a projection. Is that a promise?',coachCue:'Listen for a clear distinction between a dated estimate, its assumptions, and a verified fact.'},
   {clientLine:'Then what can you show me before I decide?',coachCue:'Listen for an offer to source current evidence and give the client room to verify it independently.'}
  ],
  lookFors:[{id:'no-guarantee',label:'States clearly that a future return is not guaranteed'},{id:'assumptions',label:'Separates evidence, estimates, and assumptions'},{id:'independent-check',label:'Offers current sources and room to verify'}],
  avoid:'Promising an outcome, presenting a projection as certain, or using an unverified headline figure to create urgency.',
  model:'“I can’t guarantee a future return. I can bring up the latest documented figures, show what assumptions they use, and give you time to review them independently before you decide.”',
  debrief:'How did the advisor stay helpful without promising an outcome they cannot control?'
 },
 {
  id:'missed-callback',title:'Repair the missed callback',skill:'Service recovery',level:'Core',
  setup:'A client has been waiting for a promised update. Practise repairing trust with ownership, a sincere apology, and a specific next action.',
  trainerBrief:'You expected an update yesterday about a viewing and heard nothing. You are frustrated, but still open to continuing if the advisor takes responsibility and follows through.',
  turns:[
   {clientLine:'You said you would call yesterday. I waited and heard nothing.',coachCue:'Listen for an unqualified apology and ownership before any explanation.'},
   {clientLine:'I do not want another vague promise.',coachCue:'Listen for one concrete action, one named owner, and a realistic time.'},
   {clientLine:'If the update is delayed again, what should I expect?',coachCue:'Listen for a transparent fallback plan and a way for the client to choose what happens next.'}
  ],
  lookFors:[{id:'own-it',label:'Acknowledges the missed commitment and apologizes'},{id:'specific',label:'Names an owner, action, and realistic time'},{id:'fallback',label:'Agrees a clear update if the plan changes'}],
  avoid:'Blaming a colleague, minimizing the impact, or making another promise without checking that it is achievable.',
  model:'“You’re right to expect the update I promised. I’m sorry I missed it. I’ll check the viewing status now and send you a clear update by 2 pm; if I can’t confirm it by then, I’ll tell you what is still pending.”',
  debrief:'Which part of the repair made the next commitment feel more dependable?'
 },
 {
  id:'permission-to-share',title:'Before we share your details',skill:'Privacy & consent',level:'Challenge',
  setup:'A teammate asks for a client’s contact details to coordinate a viewing. Practise checking purpose, permission, and the minimum information needed.',
  trainerBrief:'You are the client. You are happy to coordinate the viewing but want to know exactly who will contact you and why. You do not want your details forwarded broadly or reused for unrelated messages.',
  turns:[
   {clientLine:'Can you send my number to the person arranging the viewing?',coachCue:'Listen for the advisor to confirm the recipient and purpose before sharing anything.'},
   {clientLine:'Will they use it for anything else?',coachCue:'Listen for a plain explanation of the limited purpose and a chance to decline.'},
   {clientLine:'Only for the viewing, and please use my work number.',coachCue:'Listen for confirmation of the specific permission and the minimum detail to pass on.'}
  ],
  lookFors:[{id:'purpose',label:'Confirms who needs the detail and why'},{id:'choice',label:'Gives the client a genuine choice before sharing'},{id:'minimum',label:'Uses only the detail and purpose agreed'}],
  avoid:'Forwarding first and asking later, assuming consent from an earlier conversation, or sharing more than the agreed purpose needs.',
  model:'“I can coordinate that. Before I pass anything on, may I confirm which person will receive it and that they’ll use your work number only to arrange this viewing?”',
  debrief:'What did the advisor confirm before treating the request as permission?'
 },
 {
  id:'budget-tradeoffs',title:'Keep the brief inside budget',skill:'Needs & priorities',level:'Warm-up',
  setup:'A client has a firm budget and a long wish list. Practise helping them rank trade-offs instead of nudging them toward a stretch decision.',
  trainerBrief:'You need a two-bedroom home near your commute route and have a firm total budget. A balcony would be nice, but you do not want to borrow more or be pressured to stretch.',
  turns:[
   {clientLine:'I need two bedrooms, an easier commute, and I cannot go over my budget.',coachCue:'Listen for the advisor to confirm the budget boundary and the most important need.'},
   {clientLine:'A balcony would be lovely, but it is not worth stretching for.',coachCue:'Listen for a respectful distinction between a must-have and a preference.'},
   {clientLine:'Can we look at what fits without going over?',coachCue:'Listen for a clear next step that keeps the client’s stated limit intact.'}
  ],
  lookFors:[{id:'boundary',label:'Treats the client’s budget limit as a real boundary'},{id:'priority',label:'Separates needs from preferences with permission'},{id:'fit',label:'Keeps the next step within the agreed limit'}],
  avoid:'Suggesting a stretch, minimizing total costs, or framing a client preference as a must-have without checking.',
  model:'“Absolutely. Let’s keep your total budget as the boundary, then rank the commute and second bedroom ahead of the balcony. I’ll only bring back options that fit what you’ve agreed.”',
  debrief:'How did naming the boundary change the client’s freedom to explore trade-offs?'
 }
]);

export function validateRoleplayLibrary(scenarios=ROLEPLAY_SCENARIOS){
 if(!Array.isArray(scenarios)||scenarios.length<3)throw new Error('The role-play library needs at least three scenarios.');
 const ids=new Set();
 for(const scenario of scenarios){
  const hasText=value=>typeof value==='string'&&value.trim().length>0;
  if(!scenario||!hasText(scenario.id)||ids.has(scenario.id)||!hasText(scenario.title)||!hasText(scenario.skill)||!hasText(scenario.level)||!hasText(scenario.setup)||!hasText(scenario.trainerBrief)||!Array.isArray(scenario.turns)||scenario.turns.length<2||scenario.turns.length>4||!Array.isArray(scenario.lookFors)||scenario.lookFors.length<2||scenario.lookFors.length>4||!hasText(scenario.avoid)||!hasText(scenario.model)||!hasText(scenario.debrief))throw new Error('A role-play scenario is incomplete or duplicated.');
  ids.add(scenario.id);
  const moveIds=scenario.lookFors.map(item=>item?.id);
  if(scenario.lookFors.some(item=>!hasText(item?.id)||!hasText(item?.label))||new Set(moveIds).size!==moveIds.length)throw new Error('Every role-play coaching move needs a unique ID and a clear label.');
  if(scenario.turns.some(turn=>!hasText(turn?.clientLine)||!hasText(turn?.coachCue)))throw new Error('Every role-play turn needs a client line and a trainer coaching cue.');
 }
 return true;
}
