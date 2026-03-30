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
    `🌸 Obrigado por escolher a Flores Nobre!\n\n` +
    `Cadastre as datas mais importantes da sua vida e receba lembretes antes de cada ocasião.\n` +
    `👉 Cadastre agora: ${panelUrl}\n\n` +
    `Benefícios diretos:\n` +
    `• Avisos antes das datas\n` +
    `• Ofertas exclusivas\n` +
    `• Facilidade para presentear sem correria\n\n` +
    `Mais momentos especiais para quem você ama 💐`
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
