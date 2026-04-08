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
