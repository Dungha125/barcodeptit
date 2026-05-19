const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchDisplay() {
  const res = await fetch(`${API_BASE}/api/display`);
  if (!res.ok) throw new Error(`Display API: ${res.status}`);
  return res.json();
}
