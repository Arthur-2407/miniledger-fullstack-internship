export function normalizePhone(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new Error('Phone number must be a non-empty string');
  }

  // Remove whitespace, hyphens, parentheses
  const cleaned = rawPhone.replace(/[\s\-()]/g, '');

  // If it starts with '+', validate and keep
  if (cleaned.startsWith('+')) {
    const digitsOnly = cleaned.slice(1);
    if (!/^\d{10,15}$/.test(digitsOnly)) {
      throw new Error('Invalid international phone number format');
    }
    return `+${digitsOnly}`;
  }

  // If 10 digits (common Indian number format), prefix with +91
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // If 12 digits starting with 91, prefix with +
  if (/^91\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // Otherwise, if 11-15 digits, prefix with +
  if (/^\d{11,15}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  throw new Error('Invalid phone number format. Please provide a valid 10-digit or E.164 phone number.');
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  const lastFour = phone.slice(-4);
  const prefix = phone.slice(0, 3);
  const asterisks = '*'.repeat(Math.max(phone.length - 7, 4));
  return `${prefix} ${asterisks} ${lastFour}`;
}
