import { render } from '@testing-library/react';
import { EmergencyRoot } from '@/react/components/EmergencyRoot/index';
import { EmergencyProvider } from '@/react/context';
import type { EmergencyController } from '@/core/controller';

export function renderEmergency(controller: EmergencyController) {
  return render(
    <EmergencyProvider
      value={{
        store: controller.store,
        client: controller.client,
        config: controller.store.getState().config,
      }}
    >
      <EmergencyRoot />
    </EmergencyProvider>,
  );
}
