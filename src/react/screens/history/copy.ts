import type { CreditHistoryKind } from '@/core/credits';

export const historyCopy = {
  title: 'Historial de alertas',
  subtitle: 'Consulta tus alertas, pruebas y recargas.',
  empty: 'Todavía no tienes alertas en tu historial.',
  loading: 'Cargando tu historial…',
  unavailable: 'No pudimos cargar tu historial.',
  showMore: 'Ver más',
  kindLabels: {
    emergency: 'Alerta',
    abort: 'Cancelación',
    recharge: 'Recarga',
    refund: 'Reembolso',
    other: 'Otro movimiento',
  } satisfies Record<CreditHistoryKind, string>,
} as const;

export function formatContacts(count: number): string {
  return count === 1 ? '1 contacto' : `${count} contactos`;
}

export function formatMessages(count: number): string {
  return count === 1 ? '1 mensaje' : `${count} mensajes`;
}

export function formatHistoryRounds(count: number): string {
  return count === 1 ? '1 ronda' : `${count} rondas`;
}
