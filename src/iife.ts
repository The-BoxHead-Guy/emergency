import { mount as mountBase } from '@/mount';
import type { EmergencyClient, EmergencyMountOptions } from '@/core/types';

declare global {
  // Injected by scripts/inject-iife-styles.mjs after `vp pack`.
  // eslint-disable-next-line no-var -- var is required for `declare global`.
  var __DE_EMERGENCY_CSS_TEXT__: string | undefined;
}

const STYLE_ID = 'de-emergency-styles';

let activeMounts = 0;

function installStyles(): void {
  if (typeof document === 'undefined') {
    return;
  }

  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.setAttribute('data-de-emergency', '');
  style.textContent = globalThis.__DE_EMERGENCY_CSS_TEXT__ ?? '';
  (document.head ?? document.documentElement).appendChild(style);
}

function releaseStyles(): void {
  if (activeMounts > 0 || typeof document === 'undefined') {
    return;
  }

  document.getElementById(STYLE_ID)?.remove();
}

export function mount(options: EmergencyMountOptions): EmergencyClient {
  installStyles();
  activeMounts += 1;

  const client = mountBase(options);
  let destroyed = false;

  const destroy = client.destroy.bind(client);
  client.destroy = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    destroy();
    activeMounts = Math.max(0, activeMounts - 1);
    releaseStyles();
  };

  return client;
}

const api = { mount };

declare global {
  interface Window {
    DataEmergenciaEmergency?: typeof api;
  }
}

if (typeof window !== 'undefined') {
  window.DataEmergenciaEmergency = api;
}
