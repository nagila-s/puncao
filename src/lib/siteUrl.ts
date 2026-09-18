export function getSiteUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  return '';
}

export function getAuthCallbackUrl(): string {
  return `${getSiteUrl()}/auth/callback`;
}

export function getPasswordRecoveryUrl(): string {
  return `${getSiteUrl()}/auth/callback`;
}

/** Página do Punção no site da Fundação (botão Voltar). */
export function getLandingUrl(): string {
  const fromEnv = import.meta.env.VITE_LANDING_URL as string | undefined;
  return (fromEnv ?? '').trim();
}
