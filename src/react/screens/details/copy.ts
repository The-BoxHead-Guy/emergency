import { calculateRounds } from '@/react/screens/primary/data';

export const detailsCopy = {
  title: 'Detalles',
  summaryTitle: 'Alertas Disponibles',
  historyTitle: 'Historial de alertas',
  historySubtitle: 'Tus últimas alertas y recargas.',
  historyEmpty: 'Todavía no tienes alertas en tu historial.',
  summaryEmpty: 'Todavía no tienes un saldo de alertas disponible.',
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
): readonly AlertBalancePart[] {
  if (
    !Number.isFinite(messages) ||
    !Number.isFinite(responders) ||
    messages < 0 ||
    responders < 0
  ) {
    return [];
  }

  const rounds = calculateRounds(messages, responders);
  const messagesUnit =
    messages === 1 ? detailsCopy.messagesSingular : detailsCopy.messagesPlural;
  const contactsUnit =
    responders === 1
      ? detailsCopy.contactsSingular
      : detailsCopy.contactsPlural;
  const roundsUnit =
    rounds === 1 ? detailsCopy.roundsSingular : detailsCopy.roundsPlural;

  return [
    messages === 1 ? 'Te queda ' : 'Te quedan ',
    messages,
    ` ${messagesUnit}, dado que tienes `,
    responders,
    ` ${contactsUnit}, `,
    rounds === 1 ? 'te queda ' : 'te quedan ',
    rounds,
    ` ${roundsUnit}.`,
  ];
}

/** Builds the stakeholder-facing balance sentence. */
export function formatAlertBalance(
  messages: number,
  responders: number,
): string {
  return alertBalanceParts(messages, responders).join('');
}
