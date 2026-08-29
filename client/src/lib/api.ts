import { getToken, removeToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...Object.fromEntries(Object.entries(options.headers || {})),
    },
  });

  if (res.status === 401) {
    removeToken();
    window.location.href = '/login';
  }

  return res;
}

export async function apiFetchStream(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...Object.fromEntries(Object.entries(options.headers || {})),
    },
  });

  if (res.status === 401) {
    removeToken();
    window.location.href = '/login';
  }

  return res;
}
