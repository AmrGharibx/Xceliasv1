import { sequenceChoiceForOrder } from '../public/trainer-activities/live-sequence.mjs';

const orderSlots = Object.freeze(Array.from({ length: 6 }, (_, index) => `sequence-order-${index}`));

function round(id, prompt, steps, correctOrder, explanation) {
  return Object.freeze({
    id,
    prompt,
    type: 'sequence',
    steps: Object.freeze(steps),
    // These opaque slots preserve the existing bounded live-answer storage;
    // they are never presented as choices or sent to a learner's phone.
    options: orderSlots,
    answer: sequenceChoiceForOrder(correctOrder),
    explanation,
  });
}

export const SEQUENCE_SPRINT_ACTIVITY = Object.freeze({
  id: 'sequence-sprint',
  title: 'Sequence Sprint',
  category: 'Client-care sequences',
  level: 'Warm-up',
  duration_minutes: 6,
  description: 'A cooperative ordering game: put three client-care moves in a thoughtful sequence, then compare your reasoning with the coaching reveal.',
  questions: Object.freeze([
    round(
      'ss-discovery',
      'A client says they need a two-bedroom home soon. Put the discovery moves in a useful order.',
      ['Agree on a useful next step together.', 'Ask what is driving the move.', 'Clarify timing and flexibility.'],
      [1, 2, 0],
      'Start by understanding the reason for the move, then clarify the timeline and flexibility. With that context, agree on a useful next step instead of rushing into recommendations.',
    ),
    round(
      'ss-verify',
      'You are unsure whether a listed feature is included. Put the trust-building response in order.',
      ['Agree on a realistic follow-up time.', 'Say clearly that the detail is not verified yet.', 'Check a current, approved source.'],
      [1, 2, 0],
      'Be transparent about what you do not yet know, verify it from a current approved source, then close the loop with a realistic follow-up time.',
    ),
    round(
      'ss-viewing',
      'A client has just finished a viewing. Put the debrief moves in order.',
      ['Reflect the main trade-off you heard.', 'Ask an open, neutral question about their reaction.', 'Listen without defending the property.'],
      [1, 2, 0],
      'Invite an honest reaction with a neutral question, listen without trying to persuade, and then reflect the trade-off you heard so the client can confirm or correct it.',
    ),
    round(
      'ss-follow-up',
      'You are preparing a follow-up after a client asks for more detail. Put the helpful moves in order.',
      ['Confirm the preferred channel and timing.', 'Ask which details would help with their decision.', 'Send only verified details they requested.'],
      [1, 0, 2],
      'First learn what would actually help the client decide, agree how and when they want to hear from you, and send only details you have verified.',
    ),
    round(
      'ss-handoff',
      'A colleague will take over a client conversation. Put the respectful handoff in order.',
      ['Share relevant context with the colleague.', 'Introduce the next owner and agree on follow-up.', 'Ask the client for permission to share context.'],
      [2, 0, 1],
      'Ask permission before sharing context, pass along only what is relevant, then introduce the next owner and agree how follow-up will happen.',
    ),
  ]),
});
