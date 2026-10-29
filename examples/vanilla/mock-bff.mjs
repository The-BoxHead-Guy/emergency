#!/usr/bin/env node
/**
 * Minimal mock of the emergency BFF for the vanilla lab.
 * Implements the same JSON contract as packages/emergency-bff and adds a
 * deterministic fixture switch used only by the lab (`POST /__scenario`).
 */
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 8787);
const CODE = 'DABC12';
const CSRF_TOKEN = 'demo-csrf-token';
const FIXED_SENT_AT = '2026-10-29T14:35:00.000Z';
const FIXED_DELIVERED_AT = '2026-10-29T14:36:00.000Z';
const FIXED_READ_AT = '2026-10-29T14:37:00.000Z';

const scenarios = new Set([
  'default',
  'active-mixed',
  'active-delivered-read',
  'active-failed',
  'simulacrum-success',
  'simulacrum-error',
  'activate-error',
  'abort-error',
  'session-error',
  'slow',
]);

let scenario = 'default';
let activeEmergency = null;

function messages(content, sentAt = FIXED_SENT_AT) {
  return [{ content, sent_at: sentAt }];
}

function fixtures() {
  const mixed = [
    {
      phone: '573001234567',
      name: 'Ana Pérez',
      sent: true,
      delivered: true,
      read: false,
      failed: false,
      message_id: 'msg-1',
      sent_at: FIXED_SENT_AT,
      delivered_at: FIXED_DELIVERED_AT,
      read_at: null,
      last_messages: messages('Emergencia recibida, voy en camino.'),
    },
    {
      phone: '573007654321',
      name: 'Carlos Ruiz',
      sent: true,
      delivered: false,
      read: false,
      failed: false,
      message_id: 'msg-2',
      sent_at: FIXED_SENT_AT,
      delivered_at: null,
      read_at: null,
      last_messages: messages('Enterado.'),
    },
  ];
  const deliveredRead = [
    {
      ...mixed[0],
      read: true,
      read_at: FIXED_READ_AT,
    },
    {
      ...mixed[1],
      delivered: true,
      delivered_at: FIXED_DELIVERED_AT,
    },
  ];
  const failed = [
    {
      phone: '573001234567',
      name: 'Ana Pérez',
      sent: true,
      delivered: false,
      read: false,
      failed: true,
      message_id: 'msg-1',
      sent_at: null,
      delivered_at: null,
      read_at: null,
      last_messages: [],
    },
    {
      phone: '573007654321',
      name: 'Carlos Ruiz',
      sent: true,
      delivered: false,
      read: false,
      failed: false,
      message_id: 'msg-2',
      sent_at: FIXED_SENT_AT,
      delivered_at: null,
      read_at: null,
      last_messages: messages(''),
    },
  ];

  if (scenario === 'active-delivered-read') {
    return deliveredRead;
  }

  if (scenario === 'active-failed') {
    return failed;
  }

  return mixed;
}

function json(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Request-Id': `mock-${Date.now()}`,
  });
  response.end(JSON.stringify(body));
}

function error(response, status, code, message) {
  json(response, status, {
    error: { code, message, details: [], request_id: `mock-${Date.now()}` },
  });
}

function cors(request, response) {
  const origin = request.headers.origin ?? '*';

  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, X-CSRF-Token, X-Requested-With, Idempotency-Key'
  );
  response.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, DELETE, OPTIONS'
  );
}

async function body(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

function emergencyPayload() {
  return {
    emergency_id: activeEmergency.id,
    id: activeEmergency.id,
    is_active: true,
    initiator_id: CODE,
    responders: activeEmergency.responders,
    created_at: activeEmergency.createdAt,
    updated_at: new Date().toISOString(),
  };
}

function startEmergency() {
  activeEmergency = {
    id: `emg-${Date.now()}`,
    responders: fixtures(),
    createdAt: new Date().toISOString(),
  };

  return activeEmergency;
}

const server = createServer(async (request, response) => {
  cors(request, response);

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
  const route = url.pathname.replace(/^\/de-bff\/emergency/, '');
  const mutating = request.method === 'POST' || request.method === 'DELETE';

  if (route === '/__scenario') {
    const payload = await body(request);

    scenario = scenarios.has(payload.scenario) ? payload.scenario : 'default';
    activeEmergency = null;
    json(response, 200, { scenario });
    return;
  }

  if (mutating && request.headers['x-csrf-token'] !== CSRF_TOKEN) {
    error(
      response,
      403,
      'csrf_failed',
      'The CSRF token is missing or invalid.'
    );
    return;
  }

  if (request.method === 'GET' && route === '/config') {
    json(response, 200, {
      route_prefix: '/de-bff/emergency',
      realtime: {
        mode: 'public',
        pusher: { key: '', cluster: '', channel_pattern: 'whatsapp.{phone}' },
      },
      csrf_token: CSRF_TOKEN,
    });
    return;
  }

  if (request.method === 'POST' && route === '/session') {
    const payload = await body(request);

    if (scenario === 'session-error') {
      error(response, 500, 'upstream_error', 'Session creation failed.');
      return;
    }

    if (payload.code !== CODE) {
      error(response, 422, 'invalid_code', 'The identity code is not valid.');
      return;
    }

    json(response, 201, {
      code: CODE,
      csrf_token: CSRF_TOKEN,
      expires_in: 3600,
    });
    return;
  }

  if (request.method === 'GET' && route === '/current') {
    const realtime = {
      mode: 'public',
      pusher: { key: '', cluster: '', channel_pattern: 'whatsapp.{phone}' },
    };

    if (scenario.startsWith('active-') && !activeEmergency) {
      startEmergency();
    }

    if (!activeEmergency) {
      json(response, 200, { active: false, emergency: null, realtime });
      return;
    }

    json(response, 200, {
      active: true,
      emergency: emergencyPayload(),
      realtime,
    });
    return;
  }

  if (
    request.method === 'POST' &&
    (route === '/activate' || route === '/simulacrum')
  ) {
    const payload = route === '/activate' ? await body(request) : {};
    const simulated = route === '/simulacrum';

    if (scenario === 'slow') {
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    if (scenario === 'activate-error' && !simulated) {
      error(response, 502, 'upstream_error', 'Activation failed.');
      return;
    }

    if (scenario === 'simulacrum-error' && simulated) {
      error(response, 500, 'upstream_error', 'Simulation failed.');
      return;
    }

    if (!simulated && !payload.geolocation) {
      error(response, 422, 'validation_failed', 'Geolocation is required.');
      return;
    }

    if (!simulated && activeEmergency) {
      error(
        response,
        409,
        'emergency_already_active',
        'An emergency is already active.'
      );
      return;
    }

    const responders = fixtures();
    const result = {
      emergency_id: simulated ? null : `emg-${Date.now()}`,
      simulated,
      responders,
      failures: [],
      partial_failure: false,
      total_failure: false,
    };

    if (!simulated) {
      activeEmergency = {
        id: result.emergency_id,
        responders,
        createdAt: new Date().toISOString(),
      };
    }

    json(response, 201, result);
    return;
  }

  if (request.method === 'POST' && /^\/[^/]+\/refresh$/.test(route)) {
    if (!activeEmergency) {
      error(
        response,
        404,
        'emergency_not_found',
        'The emergency was not found.'
      );
      return;
    }

    activeEmergency.responders =
      scenario === 'active-delivered-read'
        ? fixtures()
        : activeEmergency.responders;
    json(response, 200, {
      emergency: emergencyPayload(),
      responders: activeEmergency.responders,
    });
    return;
  }

  if (request.method === 'DELETE' && /^\/[^/]+$/.test(route)) {
    if (scenario === 'abort-error') {
      error(response, 500, 'upstream_error', 'Abort failed.');
      return;
    }

    if (!activeEmergency || route !== `/${activeEmergency.id}`) {
      error(
        response,
        404,
        'emergency_not_found',
        'The emergency was not found.'
      );
      return;
    }

    activeEmergency = null;
    json(response, 200, {
      emergency_id: route.slice(1),
      deleted: true,
      simulated: false,
      responders: fixtures(),
      failures: [],
    });
    return;
  }

  error(response, 404, 'not_found', 'Route not found.');
});

server.listen(PORT, () => {
  console.log(
    `Mock emergency BFF listening on http://localhost:${PORT}/de-bff/emergency`
  );
});
