import { alertBalanceParts } from '@/react/screens/details/copy';

export interface AlertBalanceSentenceProps {
  readonly messages: number;
  readonly responders: number;
  readonly rounds: number;
  readonly extraAlerts: number;
}

/** Renders the balance sentence with its numbers visually emphasized. */
export function AlertBalanceSentence({
  messages,
  responders,
  rounds,
  extraAlerts,
}: AlertBalanceSentenceProps) {
  const parts = alertBalanceParts(messages, responders, rounds, extraAlerts);

  return (
    <>
      {parts.map((part, index) =>
        typeof part === 'number' ? <strong key={index}>{part}</strong> : part,
      )}
    </>
  );
}
