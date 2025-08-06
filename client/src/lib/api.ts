import { getAuthHeaders } from './auth';

export const apiRequest = async (
  method: string,
  url: string,
  data?: unknown
): Promise<Response> => {
  const response = await fetch(url, {
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
