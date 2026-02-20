export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "elo"
  | "discover"
  | "diners"
  | "jcb"
  | "unknown";

export const detectCardBrand = (cardNumber: string): CardBrand => {
  const sanitized = cardNumber.replace(/\s/g, "");

  // Visa
  if (/^4/.test(sanitized)) {
    return "visa";
  }

  // Mastercard
  if (/^5[1-5]/.test(sanitized) || /^2[2-7]/.test(sanitized)) {
    return "mastercard";
  }

  // American Express
  if (/^3[47]/.test(sanitized)) {
    return "amex";
  }

  // Elo
  if (
    /^(4011|4312|4389|4514|4576|5041|5066|5067|6277|6362|6363|6504|6505|6516)/.test(
      sanitized,
    )
  ) {
    return "elo";
  }

  // Discover
  if (/^6(?:011|5)/.test(sanitized)) {
    return "discover";
  }

  // Diners
  if (/^3(?:0[0-5]|[68])/.test(sanitized)) {
    return "diners";
  }

  // JCB
  if (/^35/.test(sanitized)) {
    return "jcb";
  }

  return "unknown";
};

export const formatCardNumber = (value: string): string => {
  const sanitized = value.replace(/\D/g, "");
  const brand = detectCardBrand(sanitized);

  // Amex: 4-6-5 format
  if (brand === "amex") {
    const match = sanitized.match(/(\d{1,4})(\d{1,6})?(\d{1,5})?/);
    if (match) {
      return [match[1], match[2], match[3]].filter(Boolean).join(" ");
    }
  }

  // Default: 4-4-4-4 format
  const match = sanitized.match(/(\d{1,4})/g);
  return match ? match.join(" ") : "";
};

export const formatExpiryDate = (value: string): string => {
  const sanitized = value.replace(/\D/g, "");
  if (sanitized.length >= 2) {
    return `${sanitized.slice(0, 2)}/${sanitized.slice(2, 4)}`;
  }
  return sanitized;
};

export const validateCardNumber = (cardNumber: string): boolean => {
  const sanitized = cardNumber.replace(/\s/g, "");

  if (!/^\d+$/.test(sanitized)) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

export const validateExpiryDate = (expiry: string): boolean => {
  const sanitized = expiry.replace(/\D/g, "");

  if (sanitized.length !== 4) {
    return false;
  }

  const month = parseInt(sanitized.slice(0, 2), 10);
  const year = parseInt("20" + sanitized.slice(2, 4), 10);

  if (month < 1 || month > 12) {
    return false;
  }

  const now = new Date();
  const expDate = new Date(year, month - 1);

  return expDate > now;
};

export const validateCVV = (cvv: string, brand: CardBrand): boolean => {
  const length = brand === "amex" ? 4 : 3;
  return /^\d+$/.test(cvv) && cvv.length === length;
};
