import { Role } from "@/generated/prisma/enums";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function serialize(v: object) {
  return JSON.parse(JSON.stringify(v));
}

export const formatPhoneInput = (value: string | undefined) => {
  const numbers = value?.replace(/\D/g, "");

  // Se não tiver nenhum número, retorna vazio
  if (!numbers || numbers.length === 0) return "";

  if (!numbers.startsWith("55")) return "+" + numbers.slice(0, 18);

  // Formata baseado no comprimento
  if (numbers.length <= 2) {
    // 55 -> +55
    return `+${numbers}`;
  } else if (numbers.length <= 4) {
    // 551 -> +55 1
    return `+${numbers.slice(0, 2)} ${numbers.slice(2)}`;
  } else if (numbers.length === 5) {
    // 55119 -> +55 (11) 9
    return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(
      4,
    )}`;
  } else if (numbers.length <= 9) {
    // 551191039 -> +55 (11) 9103-9
    const firstDigit = numbers.slice(4, 5);
    const rest = numbers.slice(5);
    if (rest.length <= 3) {
      return `+${numbers.slice(0, 2)} (${numbers.slice(
        2,
        4,
      )}) ${firstDigit}${rest}`;
    } else {
      return `+${numbers.slice(0, 2)} (${numbers.slice(
        2,
        4,
      )}) ${firstDigit}${rest.slice(0, 3)}-${rest.slice(3)}`;
    }
  } else if (numbers.length <= 12) {
    // 551191039456 -> +55 (11) 9103-9456
    const firstDigit = numbers.slice(4, 5);
    const middle = numbers.slice(5, 8);
    const last = numbers.slice(8);
    return `+${numbers.slice(0, 2)} (${numbers.slice(
      2,
      4,
    )}) ${firstDigit}${middle}-${last}`;
  } else if (numbers.length <= 13) {
    // 5511910394565 -> +55 (11) 91039-4565
    const firstPart = numbers.slice(4, 9);
    const lastPart = numbers.slice(9, 13);
    return `+${numbers.slice(0, 2)} (${numbers.slice(
      2,
      4,
    )}) ${firstPart}-${lastPart}`;
  } else {
    // Limita a 13 dígitos
    const limited = numbers.slice(0, 13);
    const firstPart = limited.slice(4, 9);
    const lastPart = limited.slice(9, 13);
    return `+${limited.slice(0, 2)} (${limited.slice(
      2,
      4,
    )}) ${firstPart}-${lastPart}`;
  }
};

export async function safeCopyToClipboard(
  text: string | null | undefined,
): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined" || !text)
    return false;

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;

    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function canPerformAction(
  allowRoles: Role[],
  role: Role | null | undefined,
) {
  if (!role) return false;
  if (role === Role.ADMIN || role === Role.OWNER) return true;
  return allowRoles.includes(role);
}

export const convertCurrencyInput = (numbers: string | undefined) => {
  const cleanNumbers = numbers?.replace(/\D/g, "").replace(/^0+/, "");

  if (!cleanNumbers) return cleanNumbers;

  const padded = cleanNumbers.padStart(3, "0");

  const cents = padded.slice(-2);
  const reais = padded.slice(0, -2);

  return `${reais}.${cents}`;
};

export const formatCNPJInput = (input: string | undefined) => {
  const raw = input?.replace(/\D/g, "");
  if (!raw || raw === "") return "";

  if (raw.length <= 2) {
    return raw;
  } else if (raw.length === 3) {
    return `${raw.slice(0, 2)}.${raw.slice(2)}`;
  } else if (raw.length <= 5) {
    return `${raw.slice(0, 2)}.${raw.slice(2)}`;
  } else if (raw.length === 6) {
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
  } else if (raw.length <= 8) {
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
  } else if (raw.length === 9) {
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(
      5,
      8,
    )}/${raw.slice(8)}`;
  } else if (raw.length <= 12) {
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(
      5,
      8,
    )}/${raw.slice(8)}`;
  } else if (raw.length === 13) {
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(
      5,
      8,
    )}/${raw.slice(8, 12)}-${raw.slice(12)}`;
  } else if (raw.length === 14) {
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(
      5,
      8,
    )}/${raw.slice(8, 12)}-${raw.slice(12)}`;
  }

  return "";
};

export const formatCPFInput = (input: string | undefined) => {
  const raw = input?.replace(/\D/g, "");
  if (!raw || raw === "") return "";

  if (raw.length <= 3) {
    return raw;
  } else if (raw.length <= 6) {
    return `${raw.slice(0, 3)}.${raw.slice(3)}`;
  } else if (raw.length <= 9) {
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
  } else {
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(
      6,
      9,
    )}-${raw.slice(9)}`;
  }
};

export function formatZipCodeInput(raw: string | undefined) {
  if (!raw) return "";

  if (raw.length > 5) {
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  } else return raw;
}

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

export function isValidUUID(id: string | undefined) {
  if (!id || id === "00000000-0000-0000-0000-000000000000") return false;
  return true;
}
