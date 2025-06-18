export function getApiBaseUrl() {
  return (
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    'http://localhost:5000'
  );
}
