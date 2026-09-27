// Stable, non-secret encoding for three-step live ordering rounds. The answer
// key itself stays in the server-only facilitator deck.
export const SEQUENCE_ORDERS = Object.freeze([
  Object.freeze([0, 1, 2]),
  Object.freeze([0, 2, 1]),
  Object.freeze([1, 0, 2]),
  Object.freeze([1, 2, 0]),
  Object.freeze([2, 0, 1]),
  Object.freeze([2, 1, 0]),
]);

export function sequenceOrderForChoice(choice) {
  return Number.isInteger(choice) && choice >= 0 && choice < SEQUENCE_ORDERS.length
    ? [...SEQUENCE_ORDERS[choice]]
    : null;
}

export function sequenceChoiceForOrder(order) {
  if (!Array.isArray(order) || order.length !== 3 || order.some(value => !Number.isInteger(value))) return null;
  const choice = SEQUENCE_ORDERS.findIndex(candidate => candidate.every((value, index) => value === order[index]));
  return choice < 0 ? null : choice;
}
