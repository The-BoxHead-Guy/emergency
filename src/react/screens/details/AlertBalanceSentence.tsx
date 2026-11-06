import { alertBalanceParts } from '@/react/screens/details/copy';

export interface AlertBalanceSentenceProps {
  readonly messages: number;
  readonly responders: number;
}

/** Renders the balance sentence with its numbers visually emphasized. */
export function AlertBalanceSentence({
  messages,
  responders,
}: AlertBalanceSentenceProps) {
  const parts = alertBalanceParts(messages, responders);

  return (
    <>
      {parts.map((part, index) =>
        typeof part === 'number' ? <strong key={index}>{part}</strong> : part,
      )}
    </>
  );
}
