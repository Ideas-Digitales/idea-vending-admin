export function formatRutInput(value: string): string {
  const cleaned = value
    .toUpperCase()
    .replace(/[^0-9K]/g, '')
    .slice(0, 9);

  if (!cleaned) return '';
  if (cleaned.length === 1) return cleaned;

  const verifier = cleaned.slice(-1);
  const body = cleaned.slice(0, -1);

  return `${body}-${verifier}`;
}

export function isValidRut(value: string): boolean {
  const cleaned = value
    .toUpperCase()
    .replace(/[^0-9K]/g, '');

  if (cleaned.length < 2) return false;

  const verifier = cleaned.slice(-1);
  const body = cleaned.slice(0, -1);

  // Se aceptan RUTs históricos/cortos y actuales.
  if (!/^\d{1,8}$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const expectedVerifier =
    remainder === 11 ? '0' :
    remainder === 10 ? 'K' :
    String(remainder);

  return verifier === expectedVerifier;
}
