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
