const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim();

export const apiUrl = (path: string): string => {
  if (!path.startsWith("/")) {
    throw new Error(`API path must start with '/': ${path}`);
  }

  if (!API_BASE_URL) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
};

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

const parseJsonSafe = (raw: string): JsonValue | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as JsonValue;
  } catch {
    return null;
  }
};

export const apiRequest = async <T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = 15000,
): Promise<T> => {
  const url = apiUrl(path);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    const raw = await response.text();
    const parsed = parseJsonSafe(raw) as any;

    if (!response.ok) {
      const message =
        parsed?.error ||
        parsed?.message ||
        raw ||
        `Request failed (${response.status})`;
      console.error(
        `[API] ${init.method || "GET"} ${url} -> ${response.status}`,
        parsed || raw,
      );
      throw new Error(message);
    }

    return parsed as T;
  } catch (error: any) {
    const reason =
      error?.name === "AbortError" ? "Request timed out" : error?.message;
    console.error(
      `[API] ${init.method || "GET"} ${url} network error:`,
      reason || error,
    );
    throw new Error(reason || "Network request failed");
  } finally {
    clearTimeout(timeout);
  }
};
