import { OccasionType } from "@/generated/prisma/enums";
import { format } from "date-fns";

const occasionTypeLabels: Record<OccasionType, string> = {
  BIRTHDAY: "aniversário",
  WEDDING_ANNIVERSARY: "bodas",
  MOTHERS_DAY: "Dia das Mães",
  FATHERS_DAY: "Dia dos Pais",
  VALENTINES_DAY: "Dia dos Namorados",
  GRADUATION: "formatura",
  MEMORIAL: "homenagem",
  OTHER: "data especial",
};

export function buildPanelInviteMessage(panelUrl: string) {
  return (
    `🌸 *Obrigado por comprar com a Flores Nobre!*\n\n` +
    `Cadastre datas especiais e nunca esqueça de presentear quem você ama:\n` +
    `${panelUrl}\n\n` +
    `Aniversários, datas comemorativas e muito mais.\n` +
    `Receba cupons exclusivos como agradecimento! 💐`
  );
}

export function buildOccasionReminderTemplateParams(data: {
  contactName: string;
  occasionType: OccasionType;
  customName?: string | null;
  personName: string;
  date: Date;
  advanceDays: number;
  couponCode: string;
  discountValue: string;
}) {
  const typeLabel =
    data.occasionType === OccasionType.OTHER && data.customName
      ? data.customName
      : occasionTypeLabels[data.occasionType];

  return {
    nome: data.contactName.split(" ")[0],
    dias: String(data.advanceDays),
    tipo_ocasiao: typeLabel,
    nome_pessoa: data.personName,
    data: format(data.date, "dd/MM"),
    cupom: data.couponCode,
    desconto: data.discountValue,
  };
}
