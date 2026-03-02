const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

export const ADMIN_API_URL = (configuredApiUrl || "http://localhost:3000/api").replace(
  /\/+$/,
  "",
);
