import { sendMessage } from "@/lib/helena";
import createHttpError from "http-errors";

export async function sendBoleto(data: {
  orderId: string;
  message: string;
  name: string;
  phone: string;
  email: string;
  pdfLink: string;
}) {
  const pdfRes = await fetch(data.pdfLink);

  const boletoPdf = Buffer.from(await pdfRes.arrayBuffer());

  if (boletoPdf.length > 0) {
    await sendMessage(data.phone, data.message, data.pdfLink);

    // if (data.email) {
    //   const { html, text } = getBoletoTemplate(BoletoTemplateType.ISSUED, {
    //     name: data.name,
    //     orderId: data.orderId,
    //   });

    //   await sendMail({
    //     from: {
    //       name: FINANCIAL_NAME,
    //       address: FINANCIAL_MAIL,
    //     },
    //     to: [data.email],
    //     subject: "Boleto - Pedido #NOBRE" + data.orderId,
    //     html: html,
    //     text: text,
    //     attachments: [
    //       {
    //         filename: `boleto-${data.orderId}.pdf`,
    //         content: boletoPdf,
    //         contentType: "application/pdf",
    //       },
    //     ],
    //   });
    // }
  } else
    throw new createHttpError.InternalServerError("PDF do boleto está vazio");
}
