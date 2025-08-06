import { getAuthHeaders } from './auth';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || '';

function buildUrl(url: string) {
  if (!url) return API_BASE;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${API_BASE}${url}`;
  return `${API_BASE}/${url}`;
}

export const apiRequest = async (
  method: string,
  url: string,
  data?: unknown
): Promise<Response> => {
  const fullUrl = buildUrl(url);

  const response = await fetch(fullUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(errorData || response.statusText);
  }

  return response;
};
