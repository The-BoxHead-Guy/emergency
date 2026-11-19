export const creditsCopy = {
  extraPrefix: 'más',
  extraSingular: 'alerta extra',
  extraPlural: 'alertas extra',
} as const;

export function extraAlertsUnit(count: number): string {
  return count === 1 ? creditsCopy.extraSingular : creditsCopy.extraPlural;
}

export function formatExtraAlerts(count: number): string {
  return `${creditsCopy.extraPrefix} ${count} ${extraAlertsUnit(count)}`;
}
