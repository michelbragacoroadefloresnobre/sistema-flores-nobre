import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

interface DeliveryLabelData {
  orderId: string;
  honoreeName: string;
  senderName: string;
  deliveryAddress: string;
  deliveryAddressNumber: string | null;
  deliveryAddressComplement: string | null;
  deliveryNeighboorhood: string;
  deliveryZipCode: string;
  cityName: string | null;
  cityUf: string | null;
  deliveryDate: string;
  deliveryPeriod: string;
  contactPhone: string;
  supplierNote: string;
}

function getAssetPath(relativePath: string): string | null {
  const fullPath = path.join(process.cwd(), relativePath);
  return fs.existsSync(fullPath) ? fullPath : null;
}

const FONTS = {
  playfairBold: "public/fonts/PlayfairDisplay-Bold.ttf",
  poppins: "public/fonts/Poppins-Regular.ttf",
};

const COLORS = {
  brand: "#8B4513",
  title: "#333333",
  body: "#555555",
  muted: "#999999",
  separator: "#8B4513",
};

export function buildDeliveryLabelPdf(
  data: DeliveryLabelData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // A5 landscape
    const doc = new PDFDocument({
      size: [419.53, 595.28], // A5 landscape (148mm x 210mm)
      margin: 30,
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;

    // Register fonts
    const playfairPath = getAssetPath(FONTS.playfairBold);
    const poppinsPath = getAssetPath(FONTS.poppins);

    if (playfairPath) doc.registerFont("PlayfairDisplay-Bold", playfairPath);
    if (poppinsPath) doc.registerFont("Poppins", poppinsPath);

    const titleFont = playfairPath ? "PlayfairDisplay-Bold" : "Helvetica-Bold";
    const bodyFont = poppinsPath ? "Poppins" : "Helvetica";

    // Watermark (rendered first, behind everything)
    const rosePath = getAssetPath("public/marca-dagua.png");
    if (rosePath) {
      const imageSize = 300;
      const x = (pageWidth - imageSize) / 2;
      const y = (pageHeight - imageSize) / 2;
      doc.save();
      doc.opacity(0.08);
      doc.image(rosePath, x, y, { width: imageSize, height: imageSize });
      doc.restore();
    }

    let currentY = margin;

    // === HEADER: Logo + Brand Name + Order ID ===
    const logoPath = getAssetPath("public/logo.png");
    if (logoPath) {
      doc.image(logoPath, margin, currentY, { width: 40, height: 40 });
    }

    doc
      .font(titleFont)
      .fontSize(16)
      .fillColor(COLORS.brand)
      .text("FLORES NOBRE", margin + 48, currentY + 4, { lineBreak: false });

    const shortId = data.orderId.slice(-6).toUpperCase();
    doc
      .font(bodyFont)
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text(`Pedido #${shortId}`, margin + 48, currentY + 24, {
        lineBreak: false,
      });

    currentY += 50;

    // Separator
    doc
      .save()
      .opacity(0.4)
      .moveTo(margin, currentY)
      .lineTo(pageWidth - margin, currentY)
      .strokeColor(COLORS.separator)
      .lineWidth(1.5)
      .stroke()
      .restore();

    currentY += 16;

    // === ENTREGAR PARA ===
    doc
      .font(titleFont)
      .fontSize(10)
      .fillColor(COLORS.brand)
      .text("ENTREGAR PARA", margin, currentY);

    currentY += 16;

    doc
      .font(bodyFont)
      .fontSize(14)
      .fillColor(COLORS.title)
      .text(data.honoreeName, margin, currentY);

    currentY += 24;

    // Separator
    drawSeparator(doc, margin, pageWidth, currentY);
    currentY += 14;

    // === ENDERE\u00c7O ===
    doc
      .font(titleFont)
      .fontSize(10)
      .fillColor(COLORS.brand)
      .text("ENDERE\u00c7O", margin, currentY);

    currentY += 16;

    const addressLine = `${data.deliveryAddress}, ${data.deliveryAddressNumber || "S/N"}`;
    doc
      .font(bodyFont)
      .fontSize(11)
      .fillColor(COLORS.title)
      .text(addressLine, margin, currentY);

    currentY += 16;

    if (data.deliveryAddressComplement) {
      doc
        .font(bodyFont)
        .fontSize(11)
        .fillColor(COLORS.body)
        .text(data.deliveryAddressComplement, margin, currentY);

      currentY += 16;
    }

    const cityLine = data.cityName
      ? `${data.deliveryNeighboorhood} - ${data.cityName}/${data.cityUf}`
      : data.deliveryNeighboorhood;

    doc
      .font(bodyFont)
      .fontSize(11)
      .fillColor(COLORS.title)
      .text(cityLine, margin, currentY);

    currentY += 16;

    const zipFormatted = data.deliveryZipCode.padStart(8, "0");
    const cep = `${zipFormatted.slice(0, 5)}-${zipFormatted.slice(5)}`;
    doc
      .font(bodyFont)
      .fontSize(11)
      .fillColor(COLORS.body)
      .text(`CEP: ${cep}`, margin, currentY);

    currentY += 22;

    // Separator
    drawSeparator(doc, margin, pageWidth, currentY);
    currentY += 14;

    // === ENTREGA + CONTATO (side by side) ===
    const halfWidth = contentWidth / 2;

    doc
      .font(titleFont)
      .fontSize(10)
      .fillColor(COLORS.brand)
      .text("ENTREGA", margin, currentY, {
        width: halfWidth,
        lineBreak: false,
      });

    doc
      .font(titleFont)
      .fontSize(10)
      .fillColor(COLORS.brand)
      .text("CONTATO", margin + halfWidth, currentY, {
        width: halfWidth,
        lineBreak: false,
      });

    currentY += 16;

    doc
      .font(bodyFont)
      .fontSize(11)
      .fillColor(COLORS.title)
      .text(data.deliveryDate, margin, currentY, {
        width: halfWidth,
        lineBreak: false,
      });

    doc
      .font(bodyFont)
      .fontSize(11)
      .fillColor(COLORS.title)
      .text(data.contactPhone, margin + halfWidth, currentY, {
        width: halfWidth,
        lineBreak: false,
      });

    currentY += 16;

    doc
      .font(bodyFont)
      .fontSize(11)
      .fillColor(COLORS.body)
      .text(`Per\u00edodo: ${data.deliveryPeriod}`, margin, currentY);

    currentY += 22;

    // === OBSERVA\u00c7\u00d5ES (condicional) ===
    if (data.supplierNote) {
      drawSeparator(doc, margin, pageWidth, currentY);
      currentY += 14;

      doc
        .font(titleFont)
        .fontSize(10)
        .fillColor(COLORS.brand)
        .text("OBSERVA\u00c7\u00d5ES", margin, currentY);

      currentY += 16;

      doc
        .font(bodyFont)
        .fontSize(11)
        .fillColor(COLORS.title)
        .text(data.supplierNote, margin, currentY, {
          width: contentWidth,
          lineGap: 4,
        });

      currentY =
        doc.y + 22;
    }

    // Separator
    drawSeparator(doc, margin, pageWidth, currentY);
    currentY += 14;

    // === REMETENTE ===
    doc
      .font(bodyFont)
      .fontSize(10)
      .fillColor(COLORS.body)
      .text(`Enviado por: ${data.senderName}`, margin, currentY);

    doc.end();
  });
}

function drawSeparator(
  doc: PDFKit.PDFDocument,
  margin: number,
  pageWidth: number,
  y: number,
) {
  doc
    .save()
    .opacity(0.2)
    .moveTo(margin, y)
    .lineTo(pageWidth - margin, y)
    .strokeColor(COLORS.separator)
    .lineWidth(0.5)
    .stroke()
    .restore();
}
