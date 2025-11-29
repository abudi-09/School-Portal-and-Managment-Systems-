import { getAuthToken } from "./utils";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:5000";

type RequestOptions = RequestInit & { query?: Record<string, string | number | undefined> };

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const url = new URL(path, API_BASE);
  if (query) {
    Object.keys(query).forEach((k) => {
      const v = query[k];
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

export async function apiClient(path: string, options: RequestOptions = {}) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getAuthToken();
  if (token) (headers as any).Authorization = `Bearer ${token}`;

  const { query, ...rest } = options;
  const url = buildUrl(path, query);

  const res = await fetch(url, { headers, ...rest });
  const text = await res.text();
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (err) {
    // not JSON
    payload = text;
  }
  if (!res.ok) {
    const msg = payload?.message || payload || res.statusText || "Request failed";
    const err = new Error(String(msg));
    (err as any).status = res.status;
    (err as any).payload = payload;
    throw err;
  }
  return payload;
}
