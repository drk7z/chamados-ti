import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const decodeJwtPayload = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const normalizedBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(normalizedBase64));
    return payload;
  } catch (_error) {
    return null;
  }
};

export const getTokenExpiryMs = (token) => {
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;

  return payload.exp * 1000;
};

export const isTokenExpired = (token, toleranceMs = 5000) => {
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return false;

  return Date.now() >= (expiryMs - toleranceMs);
};

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      tokenExpiresAt: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({
        user,
        token,
        tokenExpiresAt: getTokenExpiryMs(token),
        isAuthenticated: true
      }),

      logout: () => set({
        user: null,
        token: null,
        tokenExpiresAt: null,
        isAuthenticated: false
      }),

      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (!state?.token) {
          return;
        }

        if (isTokenExpired(state.token)) {
          state.logout();
          return;
        }

        if (!state.tokenExpiresAt) {
          state.setAuth(state.user, state.token);
        }
      },
    }
  )
);
