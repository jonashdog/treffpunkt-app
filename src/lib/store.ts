// ============================================================
// Store – Client-side local storage management
// Handles only locally saved data (Admin tokens, recent events)
// ============================================================

export function getAdminTokens(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem('treffpunkt-admin-tokens');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveAdminToken(eventId: string, token: string): void {
  if (typeof window === 'undefined') return;
  const tokens = getAdminTokens();
  tokens[eventId] = token;
  localStorage.setItem('treffpunkt-admin-tokens', JSON.stringify(tokens));
}

export function removeAdminToken(eventId: string): void {
  if (typeof window === 'undefined') return;
  const tokens = getAdminTokens();
  delete tokens[eventId];
  localStorage.setItem('treffpunkt-admin-tokens', JSON.stringify(tokens));
}

export function getCreatedEventIds(): string[] {
  const tokens = getAdminTokens();
  return Object.keys(tokens);
}

export function getSavedVoterName(eventId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`treffpunkt-voter-${eventId}`);
}

export function saveVoterName(eventId: string, voterName: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`treffpunkt-voter-${eventId}`, voterName);
}
