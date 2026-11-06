/** Demo quota constants. Replace these with API data in a later change. */
export const DEMO_AVAILABLE_MESSAGES = 27;
export const DEMO_DESIGNATED_RESPONDERS = 3;

/**
 * Derives the remaining alert rounds from available messages and designated
 * responders. Invalid or non-positive input collapses to the minimum of one
 * round instead of producing `Infinity`, `NaN` or a negative value.
 */
export function calculateRounds(messages: number, responders: number): number {
  if (!Number.isFinite(messages) || !Number.isFinite(responders)) {
    return 1;
  }

  const availableMessages = Math.floor(messages);
  const designatedResponders = Math.floor(responders);

  if (availableMessages <= 0 || designatedResponders <= 0) {
    return 1;
  }

  return Math.max(1, Math.floor(availableMessages / designatedResponders));
}
