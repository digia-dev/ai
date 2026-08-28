import { apiFetch } from './api';

export function getToken(): string | null {
  return localStorage.getItem('tara_token');
}

export function setToken(token: string): void {
  localStorage.setItem('tara_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('tara_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await apiFetch('/api/auth/me');
    if (!res.ok) {
      removeToken();
      return null;
    }
    return await res.json();
  } catch {
    removeToken();
    return null;
  }
}
