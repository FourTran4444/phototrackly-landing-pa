export const CONSENT_VERSION = '2026-09-23';
export const ROLES = ['Owner / founder', 'Operations / coordinator', 'Photographer', 'Editor / production', 'Other'] as const;
export const COUNTRIES = ['United States', 'Australia', 'Other'] as const;
export const VOLUMES = ['Under 25', '25–99', '100–249', '250–499', '500+', 'Not sure yet'] as const;
export type LeadInput = {
  requestId: string; source: 'hero' | 'footer'; name: string; email: string; company: string;
  role: string; country: string; volume: string; challenge: string; consent: true;
};
export type FieldErrors = Partial<Record<keyof LeadInput | 'website', string>>;
export class LeadValidationError extends Error {
  constructor(public fields: FieldErrors) { super('Please check the highlighted fields.'); }
}
export function validateLead(value: unknown): LeadInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new LeadValidationError({ email: 'Please complete the form.' });
  const raw = value as Record<string, unknown>; const errors: FieldErrors = {};
  const text = (key: keyof LeadInput, max: number, required = false): string => {
    const v = typeof raw[key] === 'string' ? raw[key].trim() : '';
    if (required && !v) errors[key] = 'This field is required.';
    else if (v.length > max) errors[key] = `Use ${max} characters or fewer.`;
    else if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v)) errors[key] = 'Please remove unsupported characters.';
    return v;
  };
  const source = raw.source === 'hero' ? 'hero' : 'footer';
  if (!['hero', 'footer'].includes(String(raw.source))) errors.source = 'Please reload the form and try again.';
  const requestId = text('requestId', 36, true);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) errors.requestId = 'Please reload the form and try again.';
  const email = text('email', 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Enter a valid work email address.';
  const company = text('company', 160, true);
  const name = text('name', 100, source === 'footer');
  const role = text('role', 50, source === 'footer');
  const country = text('country', 50, source === 'footer');
  const volume = text('volume', 50, source === 'footer');
  const challenge = text('challenge', 2000);
  if (role && !ROLES.includes(role as typeof ROLES[number])) errors.role = 'Choose a role from the list.';
  if (country && !COUNTRIES.includes(country as typeof COUNTRIES[number])) errors.country = 'Choose a country from the list.';
  if (volume && !VOLUMES.includes(volume as typeof VOLUMES[number])) errors.volume = 'Choose a job range from the list.';
  if (raw.consent !== true) errors.consent = 'Please agree to be contacted about early access.';
  if (raw.website) errors.website = 'We could not accept this registration. Please try again.';
  if (Object.keys(errors).length) throw new LeadValidationError(errors);
  return { requestId, source, name, email, company, role, country, volume, challenge, consent: true };
}
