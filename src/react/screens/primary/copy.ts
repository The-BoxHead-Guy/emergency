export const primaryCopy = {
  availabilityTitle: 'Alertas Disponibles',
  recharge: 'Recargar',
  details: 'Detalles',
  roundSingular: 'ronda disponible',
  roundPlural: 'rondas disponibles',
} as const;

/** Singular/plural label for the remaining rounds. */
export function roundsUnit(rounds: number): string {
  return rounds === 1 ? primaryCopy.roundSingular : primaryCopy.roundPlural;
}

export function formatRounds(rounds: number): string {
  return `${rounds} ${roundsUnit(rounds)}`;
}
