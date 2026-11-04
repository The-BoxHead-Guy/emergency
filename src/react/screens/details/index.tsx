import { PlaceholderScreen } from '@/react/screens/PlaceholderScreen';
import { useScreenNavigation } from '@/react/screens/context';
import type { EmergencyScreenProps } from '@/react/screens/types';
import { detailsCopy } from '@/react/screens/details/copy';

export function DetailsScreen({ titleId, onClose }: EmergencyScreenProps) {
  const { back } = useScreenNavigation();

  return (
    <PlaceholderScreen
      screen="details"
      titleId={titleId}
      title={detailsCopy.title}
      description={detailsCopy.description}
      onClose={() => onClose('close')}
      onBack={back}
    />
  );
}
