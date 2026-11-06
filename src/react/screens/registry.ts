import { DetailsScreen } from '@/react/screens/details';
import { HistoryScreen } from '@/react/screens/history';
import { MessageDetailScreen } from '@/react/screens/message-detail';
import { PreEmergencyScreen } from '@/react/screens/pre-emergency';
import { PrimaryScreen } from '@/react/screens/primary';
import { PricingScreen } from '@/react/screens/pricing';
import type {
  EmergencyScreenComponent,
  EmergencyScreenId,
} from '@/react/screens/types';

/** Every screen the panel can render. Add one entry to add a screen. */
export const screenRegistry: Readonly<
  Record<EmergencyScreenId, EmergencyScreenComponent>
> = {
  primary: PrimaryScreen,
  'pre-emergency': PreEmergencyScreen,
  pricing: PricingScreen,
  details: DetailsScreen,
  history: HistoryScreen,
  'message-detail': MessageDetailScreen,
};
