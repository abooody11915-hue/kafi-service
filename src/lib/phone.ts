export function normalizeSaudiPhone(value: string): { local: string; e164: string } | null {
  const digits = value.replace(/\D/g, "");
  let local: string;

  if (/^05\d{8}$/.test(digits)) local = digits;
  else if (/^5\d{8}$/.test(digits)) local = `0${digits}`;
  else if (/^9665\d{8}$/.test(digits)) local = `0${digits.slice(3)}`;
  else return null;

  return { local, e164: `+966${local.slice(1)}` };
}
