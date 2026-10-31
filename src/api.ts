import type { Run, Readiness, Mode, BrowserKind } from './types';

export function connection() {
  return { base: sessionStorage.getItem('possessed.api')?.replace(/\/$/, '') || '', token: sessionStorage.getItem('possessed.token') || '' };
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { base, token } = connection();
  const response = await fetch(`${base}${path}`, { ...init, headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) throw new Error('The live server is not connected. You can still explore the guided sample.');
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `The archive returned HTTP ${response.status}.`);
  return body;
}
export const getReadiness = () => api<Readiness>('/api/config');
export const getRuns = () => api<{ runs: Run[] }>('/api/runs');
export const startRun = (note: string, mode: Mode, browser: BrowserKind) => api<{ run: Run }>('/api/runs', { method: 'POST', body: JSON.stringify({ note, mode, browser }) });
export const cancelRun = (id: string) => api(`/api/runs/${id}/cancel`, { method: 'POST', body: '{}' });

export async function streamRun(id: string, signal: AbortSignal, onUpdate: (run: Run) => void) {
  const { base, token } = connection();
  const response = await fetch(`${base}/api/runs/${id}/events`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal });
  if (!response.ok || !response.body) throw new Error('The evidence stream disconnected. Refresh the run to recover its saved state.');
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let pending = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) return;
    pending += decoder.decode(value, { stream: true });
    const messages = pending.split('\n\n'); pending = messages.pop() || '';
    for (const message of messages) if (message.startsWith('data: ')) onUpdate(JSON.parse(message.slice(6)).run);
  }
}

export function downloadJson(data: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}
