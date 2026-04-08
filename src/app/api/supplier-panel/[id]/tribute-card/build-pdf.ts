import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

interface TributeCardData {
  senderName: string;
  honoreeName: string;
  tributeCardPhrase: string;
}

function getAssetPath(relativePath: string): string | null {
  const fullPath = path.join(process.cwd(), relativePath);
  return fs.existsSync(fullPath) ? fullPath : null;
}

const FONTS = {
  playfairBold: "public/fonts/PlayfairDisplay-Bold.ttf",
  poppins: "public/fonts/Poppins-Regular.ttf",
  poppinsItalic: "public/fonts/Poppins-Italic.ttf",
};

export function buildTributeCardPdf(data: TributeCardData): Promise<Buffer> {
  const { senderName, honoreeName, tributeCardPhrase } = data;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 60 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const marginLeft = 60;
    const contentWidth = pageWidth - marginLeft * 2;

    // Register custom fonts
    const playfairPath = getAssetPath(FONTS.playfairBold);
    const poppinsPath = getAssetPath(FONTS.poppins);
    const poppinsItalicPath = getAssetPath(FONTS.poppinsItalic);

    if (playfairPath) doc.registerFont("PlayfairDisplay-Bold", playfairPath);
    if (poppinsPath) doc.registerFont("Poppins", poppinsPath);
    if (poppinsItalicPath) doc.registerFont("Poppins-Italic", poppinsItalicPath);

    const titleFont = playfairPath ? "PlayfairDisplay-Bold" : "Helvetica-Bold";
    const bodyFont = poppinsItalicPath ? "Poppins-Italic" : "Helvetica-Oblique";
    const footerFont = poppinsPath ? "Poppins" : "Helvetica";

    // "De:" label + name
    doc
      .font(titleFont)
      .fontSize(22)
      .fillColor("#333333")
      .text("De: ", marginLeft, 60, { continued: true })
      .text(senderName);

    // "Para:" label + name
    doc
      .moveDown(1)
      .font(titleFont)
      .fontSize(22)
      .fillColor("#333333")
      .text("Para: ", marginLeft, undefined, { continued: true })
      .text(honoreeName);

    // Tribute phrase
    doc
      .font(bodyFont)
      .fontSize(16)
      .fillColor("#555555")
      .text(`\u201C${tributeCardPhrase}\u201D`, marginLeft, 200, {
        width: contentWidth,
        align: "center",
        lineGap: 6,
      });

    // Rose watermark (absolute position, centered on page)
    const rosePath = getAssetPath("public/marca-dagua.png");
    if (rosePath) {
      const imageSize = 575;
      const x = (pageWidth - imageSize) / 2;
      const y = (pageHeight - imageSize) / 2 + 30;
      doc.save();
      doc.opacity(0.08);
      doc.image(rosePath, x, y, { width: imageSize, height: imageSize });
      doc.restore();
    }

    // Footer
    doc
      .font(titleFont)
      .fontSize(16)
      .fillColor("#8B4513")
      .text("FLORES NOBRE", marginLeft, pageHeight - 120, {
        width: contentWidth,
        align: "center",
        lineBreak: false,
      });

    doc
      .font(footerFont)
      .fontSize(10)
      .fillColor("#999999")
      .text(
        "@floresnobre | floresnobre.com.br | 0800 550 0115",
        marginLeft,
        pageHeight - 98,
        { width: contentWidth, align: "center", lineBreak: false },
      );

    doc.end();
  });
}
