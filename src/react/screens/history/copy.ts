import type { CreditHistoryKind } from '@/core/credits';
import type { HistoryFilter } from '@/react/screens/types';

export const historyCopy = {
  title: 'Historial de alertas',
  subtitle: 'Consulta tus alertas, pruebas y recargas.',
  empty: 'Todavía no tienes alertas en tu historial.',
  loading: 'Cargando tu historial…',
  unavailable: 'No pudimos cargar tu historial.',
  showMore: 'Ver más',
  kindLabels: {
    emergency: 'Alerta',
    abort: 'Aborto',
    simulacrum: 'Simulacro',
    recharge: 'Recarga',
    refund: 'Reembolso',
    other: 'Otro movimiento',
  } satisfies Record<CreditHistoryKind, string>,
  topUpsTitle: 'Historial de recargas',
  topUpsEmpty: 'Todavía no tienes recargas en tu historial.',
  fields: {
    package: 'Paquete',
    alerts: 'Alertas',
    ref: 'Ref.',
    reporterPhone: 'Teléfono del reportante',
    seen: 'Visto',
  },
  sections: {
    balance: 'Saldo',
  },
  stats: {
    contacts: 'Contactos',
    messages: 'Mensajes',
    rounds: 'Rondas',
  },
  summary: {
    title: 'Disponible',
    loading: 'Cargando tu saldo…',
    unavailable: 'No pudimos cargar tu saldo.',
    contactsPrefix: 'para',
  },
} as const;

/** Title and empty message shown for each history filter. */
export const historyFilterCopy = {
  alerts: { title: historyCopy.title, empty: historyCopy.empty },
  'top-ups': {
    title: historyCopy.topUpsTitle,
    empty: historyCopy.topUpsEmpty,
  },
} satisfies Record<HistoryFilter, { title: string; empty: string }>;

export function historyContactsUnit(count: number): string {
  return count === 1 ? 'contacto' : 'contactos';
}

export function historyRoundsUnit(count: number): string {
  return count === 1 ? 'Ronda' : 'Rondas';
}

export function historyAlertsUnit(count: number): string {
  return count === 1 ? 'Alerta' : 'Alertas';
}

export function formatContacts(count: number): string {
  return `${count} ${historyContactsUnit(count)}`;
}

export function formatMessages(count: number): string {
  return count === 1 ? '1 mensaje' : `${count} mensajes`;
}

export function formatHistoryRounds(count: number): string {
  return `${count} ${historyRoundsUnit(count)}`;
}

export function formatHistoryAlerts(count: number): string {
  return `${count} ${historyAlertsUnit(count)}`;
}
