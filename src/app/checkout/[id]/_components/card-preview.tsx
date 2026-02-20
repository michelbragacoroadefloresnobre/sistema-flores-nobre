"use client";

import { CardBrand } from "../utils";

interface CreditCardPreviewProps {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  brand: CardBrand;
  isFlipped: boolean;
}

const CardBrandLogo = ({ brand }: { brand: CardBrand }) => {
  const logos: Record<CardBrand, string> = {
    visa: "VISA",
    mastercard: "Mastercard",
    amex: "AMEX",
    elo: "Elo",
    discover: "DISCOVER",
    diners: "Diners",
    jcb: "JCB",
    unknown: "",
  };

  if (brand === "unknown") return null;

  return (
    <div className="text-white font-bold text-xl tracking-wider">
      {logos[brand]}
    </div>
  );
};

export const CreditCardPreview = ({
  cardNumber,
  cardName,
  expiryDate,
  cvv,
  brand,
  isFlipped,
}: CreditCardPreviewProps) => {
  const displayNumber = cardNumber || "•••• •••• •••• ••••";
  const displayName = cardName.toUpperCase() || "SEU NOME AQUI";
  const displayExpiry = expiryDate || "MM/AA";
  const displayCvv = cvv || "•••";

  return (
    <div className="perspective-1000 w-full max-w-md mx-auto">
      <div
        className={`relative transition-transform duration-700 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Front of Card */}
        <div
          className="relative w-full aspect-[1.586/1] rounded-2xl shadow-2xl backface-hidden bg-[#34c759] text-white"
          style={{
            backfaceVisibility: "hidden",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent rounded-2xl" />

          <div className="relative h-full p-6 flex flex-col justify-between">
            {/* Chip and Brand */}
            <div className="flex items-start justify-between">
              <div className="w-12 h-9 bg-linear-to-br from-amber-200 to-amber-400 rounded-md opacity-90" />
              <CardBrandLogo brand={brand} />
            </div>

            {/* Card Number */}
            <div className="space-y-4">
              <div className="font-mono text-2xl tracking-[0.2em] font-light">
                {displayNumber}
              </div>

              {/* Name and Expiry */}
              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider opacity-80">
                    Titular do Cartão
                  </div>
                  <div className="font-medium text-sm tracking-wide">
                    {displayName}
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <div className="text-[10px] uppercase tracking-wider opacity-80">
                    Validade
                  </div>
                  <div className="font-mono text-sm">{displayExpiry}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div
          className="absolute inset-0 w-full aspect-[1.586/1] rounded-2xl shadow-2xl rotate-y-180 backface-hidden bg-[#34c759] text-white"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent rounded-2xl" />

          <div className="relative h-full flex flex-col">
            {/* Magnetic Stripe - Mantido preto intencionalmente para contraste */}
            <div className="h-14 bg-black/80 mt-6" />

            {/* CVV Section */}
            <div className="flex-1 p-6 flex flex-col justify-center">
              <div className="bg-black/10 rounded-lg p-4 flex items-center justify-between">
                <div className="text-xs text-white/90 font-medium">CVV</div>
                {/* Faixa do CVV mantida branca com texto escuro para realismo e legibilidade */}
                <div className="font-mono text-black text-lg tracking-wider bg-white px-3 py-1 rounded border border-white/50">
                  {displayCvv}
                </div>
              </div>

              <div className="mt-4 text-white/80 text-xs leading-relaxed">
                Este código de segurança de 3 dígitos está localizado no verso
                do seu cartão
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
