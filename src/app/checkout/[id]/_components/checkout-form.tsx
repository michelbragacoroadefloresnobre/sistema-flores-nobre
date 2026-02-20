"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock } from "lucide-react";
import { FormEvent, useState } from "react";
import {
  CardBrand,
  detectCardBrand,
  formatCardNumber,
  formatExpiryDate,
} from "../utils";
import { CreditCardPreview } from "./card-preview";

export type CheckoutFormData = {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  brand: CardBrand;
  installments: string;
};

export const CheckoutForm = ({
  onSubmit,
}: {
  onSubmit: (
    data: CheckoutFormData,
    setIsProcessing: (v: boolean) => any,
  ) => Promise<any>;
}) => {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [brand, setBrand] = useState<CardBrand>("unknown");
  const [isProcessing, setIsProcessing] = useState(false);
  const [installments, setInstallments] = useState("");

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    setBrand(detectCardBrand(formatted));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setExpiryDate(formatted);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const maxLength = brand === "amex" ? 4 : 3;
    setCvv(value.slice(0, maxLength));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(
      { cardName, cardNumber, expiryDate, cvv, brand, installments },
      setIsProcessing,
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Credit Card Preview */}
        <div className="space-y-6">
          <CreditCardPreview
            cardNumber={cardNumber}
            cardName={cardName}
            expiryDate={expiryDate}
            cvv={cvv}
            brand={brand}
            isFlipped={isFlipped}
          />

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
            <Lock className="w-4 h-4 shrink-0" />
            <p>Seus dados são criptografados e protegidos com segurança SSL</p>
          </div>
        </div>

        {/* Payment Form */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Informações de Pagamento
            </h2>
            <p className="text-muted-foreground">
              Preencha os dados do seu cartão de crédito
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Número do Cartão</Label>
              <Input
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={handleCardNumberChange}
                className="text-sm"
                maxLength={19}
                onFocus={() => setIsFlipped(false)}
              />
            </div>

            {/* Card Name */}
            <div className="space-y-2">
              <Label htmlFor="cardName">Nome no Cartão</Label>
              <Input
                id="cardName"
                type="text"
                placeholder="NOME COMO ESTÁ NO CARTÃO"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="text-sm uppercase"
                onFocus={() => setIsFlipped(false)}
              />
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Validade</Label>
                <Input
                  id="expiry"
                  type="text"
                  placeholder="MM/AA"
                  value={expiryDate}
                  onChange={handleExpiryChange}
                  maxLength={5}
                  className="text-sm"
                  onFocus={() => setIsFlipped(false)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="text"
                  placeholder={brand === "amex" ? "••••" : "•••"}
                  value={cvv}
                  onChange={handleCvvChange}
                  className="text-sm"
                  maxLength={brand === "amex" ? 4 : 3}
                  onFocus={() => setIsFlipped(true)}
                  onBlur={() => setIsFlipped(false)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="installments">Parcelas</Label>
              <Select value={installments} onValueChange={setInstallments}>
                <SelectTrigger id="installments" className="text-sm w-full">
                  <SelectValue placeholder="Selecione o número de parcelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1x sem juros</SelectItem>
                  <SelectItem value="2">2x sem juros</SelectItem>
                  <SelectItem value="3">3x sem juros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-[#34c759] hover:bg-[#34c759]/90 text-white"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="animate-pulse">Processando...</span>
                </>
              ) : (
                "Finalizar Pagamento"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
