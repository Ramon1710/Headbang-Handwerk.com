export function parseEuroAmountToCents(
  input: unknown,
  label: string,
  options?: { allowZero?: boolean; allowEmpty?: boolean },
) {
  const normalized = String(input ?? '').trim();

  if (!normalized) {
    if (options?.allowEmpty) {
      return 0;
    }

    throw new Error(`${label} darf nicht leer sein.`);
  }

  const canonical = normalized.replace(',', '.');

  if (!/^\d+(?:\.\d{1,2})?$/.test(canonical)) {
    throw new Error(`${label} muss ein gueltiger Eurobetrag mit hoechstens zwei Nachkommastellen sein.`);
  }

  const [wholePart, decimalPart = ''] = canonical.split('.');
  const cents = Number.parseInt(wholePart, 10) * 100 + Number.parseInt(decimalPart.padEnd(2, '0'), 10);

  if (!Number.isFinite(cents) || cents < 0) {
    throw new Error(`${label} darf nicht negativ sein.`);
  }

  if (!options?.allowZero && cents === 0) {
    throw new Error(`${label} muss groesser als 0 sein.`);
  }

  return cents;
}

export function formatEuroCents(cents: number) {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error('Eurobetrag muss als nicht-negativer Integer-Centwert vorliegen.');
  }

  const wholePart = Math.floor(cents / 100);
  const decimalPart = String(cents % 100).padStart(2, '0');
  const grouped = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(wholePart);

  return `${grouped},${decimalPart} €`;
}

export function formatEuroCentsForInput(cents: number) {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error('Eurobetrag muss als nicht-negativer Integer-Centwert vorliegen.');
  }

  const wholePart = Math.floor(cents / 100);
  const decimalPart = String(cents % 100).padStart(2, '0');
  return `${wholePart},${decimalPart}`;
}
