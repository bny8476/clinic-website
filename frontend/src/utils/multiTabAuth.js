/**
 * Multi-tab authentication synchronization.
 * Uses BroadcastChannel to notify other open browser tabs when a user logs out.
 */

const CHANNEL_NAME = 'medvice_auth_channel';

let authChannel = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    authChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (err) {
    console.warn('BroadcastChannel initialization failed:', err);
  }
}

export const broadcastAuthEvent = (type, payload = {}) => {
  if (authChannel) {
    try {
      authChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch (err) {
      console.warn('Failed to broadcast auth event:', err);
    }
  }
};

export const subscribeAuthEvents = (onLogout) => {
  if (!authChannel) return () => {};

  const handleMessage = (event) => {
    if (event.data && event.data.type === 'LOGOUT') {
      onLogout(event.data.payload?.reason || 'Logged out from another tab');
    }
  };

  authChannel.addEventListener('message', handleMessage);
  return () => authChannel.removeEventListener('message', handleMessage);
};
