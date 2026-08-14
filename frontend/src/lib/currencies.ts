export interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RWF', locale: 'rw-RW' },
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '\u20AC', locale: 'fr-FR' },
  { code: 'GBP', name: 'British Pound', symbol: '\u00A3', locale: 'en-GB' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', locale: 'ke-KE' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', locale: 'sw-TZ' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', locale: 'sw-UG' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', locale: 'af-ZA' },
];

// Approximate exchange rates relative to 1 RWF (base currency)
// These are static rates; in production, fetch from an API
const RATES: Record<string, number> = {
  RWF: 1,
  USD: 1 / 1350,
  EUR: 1 / 1480,
  GBP: 1 / 1720,
  KES: 1 / 10.5,
  TZS: 1 / 0.52,
  UGX: 1 / 0.36,
  ZAR: 1 / 74,
};

export function convertCurrency(amountRWF: number, toCode: string): number {
  const rate = RATES[toCode] ?? 1;
  return Math.round(amountRWF * rate * 100) / 100;
}

export function formatPrice(amountRWF: number, toCode: string): string {
  const currency = CURRENCIES.find((c) => c.code === toCode) ?? CURRENCIES[0];
  const converted = convertCurrency(amountRWF, toCode);
  return `${currency.symbol} ${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
