function normalizeRwandaPhone(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('250')) return `0${digits.slice(3)}`;
  if (digits.length === 9 && digits.startsWith('7')) return `0${digits}`;
  return digits;
}

function isValidRwandaPhone(value) {
  return /^07[2389]\d{7}$/.test(normalizeRwandaPhone(value));
}

module.exports = { normalizeRwandaPhone, isValidRwandaPhone };
