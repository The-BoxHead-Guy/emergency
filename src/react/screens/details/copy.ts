import { creditsCopy, extraAlertsUnit } from '@/react/screens/credits-copy';

export const detailsCopy = {
  title: 'Detalles',
  summaryTitle: 'Alertas Disponibles',
  alertsTitle: 'Alertas',
  alertsSubtitle: 'Tus alertas más recientes.',
  alertsEmpty: 'Todavía no tienes alertas registradas.',
  topUpTitle: 'Recargas',
  topUpSubtitle: 'Tus recargas y reembolsos más recientes.',
  topUpEmpty: 'Todavía no tienes recargas registradas.',
  summaryEmpty: 'Todavía no tienes un saldo de alertas disponible.',
  summaryLoading: 'Cargando tu saldo de alertas…',
  summaryUnavailable: 'No pudimos cargar tu saldo de alertas.',
  viewHistory: 'Ver historial',
  messagesSingular: 'mensaje de alerta',
  messagesPlural: 'mensajes de alerta',
  contactsSingular: 'contacto de emergencia',
  contactsPlural: 'contactos de emergencia',
  roundsSingular: 'ronda de avisos',
  roundsPlural: 'rondas de avisos',
} as const;

export type AlertBalancePart = string | number;

/** Returns the balance sentence split into text and emphasized number parts. */
export function alertBalanceParts(
  messages: number,
  responders: number,
  rounds: number,
  extraAlerts = 0,
): readonly AlertBalancePart[] {
  if (
    !Number.isFinite(messages) ||
    !Number.isFinite(responders) ||
    !Number.isFinite(rounds) ||
    !Number.isFinite(extraAlerts) ||
    messages < 0 ||
    responders < 0 ||
    rounds < 0 ||
    extraAlerts < 0
  ) {
    return [];
  }

  const messagesUnit =
    messages === 1 ? detailsCopy.messagesSingular : detailsCopy.messagesPlural;
  const contactsUnit =
    responders === 1
      ? detailsCopy.contactsSingular
      : detailsCopy.contactsPlural;
  const roundsUnit =
    rounds === 1 ? detailsCopy.roundsSingular : detailsCopy.roundsPlural;
  const parts: AlertBalancePart[] = [
    messages === 1 ? 'Te queda ' : 'Te quedan ',
    messages,
    ` ${messagesUnit}, dado que tienes `,
    responders,
    ` ${contactsUnit}, `,
    rounds === 1 ? 'te queda ' : 'te quedan ',
    rounds,
    ` ${roundsUnit}`,
  ];

  if (extraAlerts > 0) {
    const extraUnit = extraAlertsUnit(extraAlerts);

    parts.push(`, ${creditsCopy.extraPrefix} `, extraAlerts, ` ${extraUnit}`);
  }

  parts.push('.');

  return parts;
}

/** Builds the stakeholder-facing balance sentence. */
export function formatAlertBalance(
  messages: number,
  responders: number,
  rounds: number,
  extraAlerts = 0,
): string {
  return alertBalanceParts(messages, responders, rounds, extraAlerts).join('');
}
