import type { AlertHistoryKind } from '@/react/screens/history/data';

export const historyCopy = {
  title: 'Historial de alertas',
  subtitle: 'Consulta tus alertas, pruebas y recargas.',
  empty: 'Todavía no tienes alertas en tu historial.',
  showMore: 'Ver más',
  kindLabels: {
    emergency: 'Emergencia',
    test: 'Prueba',
    recharge: 'Recarga',
  } satisfies Record<AlertHistoryKind, string>,
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
