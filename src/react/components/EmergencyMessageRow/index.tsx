import { copy } from '@/core/copy';
import { formatShortTime } from '@/core/date';
import type { Responder } from '@/core/types';
import { Icon } from '@/react/components/Icon';
import { cls } from '@/react/classnames';

/**
 * Renders one message row per responder.
 */
export function EmergencyMessageRow({
  responder,
  locale,
}: {
  readonly responder: Responder;
  readonly locale: string;
}) {
  const message = responder.lastMessage;
  const hasContent = Boolean(message?.content);
  const modifier = hasContent
    ? 'emergency-status__message-row--success'
    : 'emergency-status__message-row--failed';
  const iconModifier = hasContent
    ? 'emergency-status__message-icon--success'
    : 'emergency-status__message-icon--failed';

  return (
    <div className={cls('emergency-status__message-row', modifier)}>
      <p className={cls('emergency-status__message-text-container')}>
        <Icon
          name="flag"
          className={cls('emergency-status__message-icon', iconModifier)}
        />
        <span className={cls('emergency-status__message-text')}>
          <strong>{copy.statusPrefix}</strong> {message?.content ?? ''}
        </span>
      </p>
      {message ? (
        <p
          className={cls(
            'emergency-status__message-text-container',
            'sent-at--verified',
          )}
        >
          <Icon
            name="double-check"
            className={cls('emergency-status__message-icon')}
          />
          {message.sentAt ? (
            <span className={cls('emergency-status__message-sent-at')}>
              {formatShortTime(message.sentAt, locale)}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
