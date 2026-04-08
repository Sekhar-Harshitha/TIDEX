type SessionProvider = {
  getCurrentUserId?: () => Promise<string | null> | string | null;
  getAuthToken?: () => Promise<string | null> | string | null;
};

declare global {
  // Wire this during login/session bootstrap in your app runtime.
  // Example: global.__tidexSessionProvider = { getCurrentUserId: () => auth.user.id, getAuthToken: () => auth.token }
  // eslint-disable-next-line no-var
  var __tidexSessionProvider: SessionProvider | undefined;
}

const decodeJwtPayload = (token: string): Record<string, any> | null => {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    if (!globalThis.atob) {
      return null;
    }

    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const normalized = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const json = globalThis.atob(normalized);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const getSessionUserIdOrThrow = async (): Promise<string> => {
  const provider = globalThis.__tidexSessionProvider;
  const userIdFromProvider = await provider?.getCurrentUserId?.();
  if (userIdFromProvider && typeof userIdFromProvider === 'string') {
    return userIdFromProvider;
  }

  const token = await provider?.getAuthToken?.();
  if (!token) {
    throw new Error('No active session provider found for authenticated user');
  }

  const payload = decodeJwtPayload(token);
  const userId = payload?.id || payload?.userId || payload?.sub;

  if (!userId || typeof userId !== 'string') {
    throw new Error('Session token does not contain user id');
  }

  return userId;
};
