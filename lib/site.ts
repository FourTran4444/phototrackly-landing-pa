export function siteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Unsupported protocol');
    return url.origin;
  } catch {
    return 'http://localhost:3000';
  }
}

export function registrationConfigured(): boolean {
  try {
    const url = new URL(process.env.EARLY_ACCESS_WEBHOOK_URL || '');
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}
