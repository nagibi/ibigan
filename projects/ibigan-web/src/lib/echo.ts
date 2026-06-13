import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import api from '@/lib/axios';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

window.Pusher = Pusher;

export function createEcho(): Echo {
  return new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8082),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8082),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel: { name: string }) => ({
      authorize: (socketId: string, callback: (error: Error | null, data?: unknown) => void) => {
        api.post('/broadcasting/auth', {
          socket_id: socketId,
          channel_name: channel.name,
        })
          .then((response) => callback(null, response.data))
          .catch((error: Error) => callback(error));
      },
    }),
  });
}

let echoInstance: Echo | null = null;

export function getEcho(): Echo {
  if (!echoInstance) {
    echoInstance = createEcho();
  }
  return echoInstance;
}

export function resetEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
