import { EmergencyHeader } from '@/react/components/EmergencyHeader';
import { EmergencyScreenLayout } from '@/react/screens/layout';
import type { EmergencyScreenId } from '@/react/screens/types';
import { cls } from '@/react/classnames';

export interface PlaceholderScreenProps {
  readonly screen: EmergencyScreenId;
  readonly titleId: string;
  readonly title: string;
  readonly description: string;
  readonly onClose: () => void;
  readonly onBack: () => void;
}

/** Minimal in-design screen used to prove navigation before real designs land. */
export function PlaceholderScreen({
  screen,
  titleId,
  title,
  description,
  onClose,
  onBack,
}: PlaceholderScreenProps) {
  return (
    <EmergencyScreenLayout
      screen={screen}
      titleId={titleId}
      header={
        <EmergencyHeader
          titleId={titleId}
          title={title}
          onClose={onClose}
          onBack={onBack}
        />
      }
      footer={null}
    >
      <div className={cls('emergency-screen__placeholder')}>
        <p className={cls('emergency-screen__placeholder-text')}>
          {description}
        </p>
      </div>
    </EmergencyScreenLayout>
  );
}
