function isAdminPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/admin');
}

export function getTokenKey(): string {
  return isAdminPath() ? 'token_admin' : 'token';
}

export function getRefreshTokenKey(): string {
  return isAdminPath() ? 'refreshToken_admin' : 'refreshToken';
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(getTokenKey());
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(getRefreshTokenKey());
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getTokenKey(), accessToken);
  localStorage.setItem(getRefreshTokenKey(), refreshToken);
}

export function setAccessToken(accessToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getTokenKey(), accessToken);
}

export function removeTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getTokenKey());
  localStorage.removeItem(getRefreshTokenKey());
}

export function hasAccessToken(): boolean {
  return !!getAccessToken();
}
