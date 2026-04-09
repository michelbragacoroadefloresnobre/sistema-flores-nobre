import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import path from "path";
import "@/lib/pdf/fonts";

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

const assetsDir = process.cwd();
const logoSrc = path.join(assetsDir, "public/logo.png");
const watermarkSrc = path.join(assetsDir, "public/marca-dagua.png");

const COLORS = {
  brand: "#8B4513",
  title: "#333333",
  body: "#555555",
  muted: "#999999",
};

const styles = StyleSheet.create({
  page: {
    padding: 0,
  },
  card: {
    height: "50%",
    padding: 30,
    position: "relative",
  },
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 300,
    height: 300,
    transform: "translate(-150, -150)",
    opacity: 0.08,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  headerBrand: {
    fontFamily: "PlayfairDisplay",
    fontWeight: "bold",
    fontSize: 16,
    color: COLORS.brand,
  },
  headerOrderId: {
    fontFamily: "Poppins",
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
  },
  mainSeparator: {
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.brand,
    opacity: 0.4,
    marginTop: 10,
    marginBottom: 12,
  },
  lightSeparator: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.brand,
    opacity: 0.2,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: "PlayfairDisplay",
    fontWeight: "bold",
    fontSize: 10,
    color: COLORS.brand,
    marginBottom: 4,
  },
  recipientName: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: COLORS.title,
  },
  bodyText: {
    fontFamily: "Poppins",
    fontSize: 11,
    color: COLORS.title,
  },
  bodyTextMuted: {
    fontFamily: "Poppins",
    fontSize: 11,
    color: COLORS.body,
  },
  row: {
    flexDirection: "row",
  },
  halfColumn: {
    width: "50%",
  },
  senderText: {
    fontFamily: "Poppins",
    fontSize: 10,
    color: COLORS.body,
  },
});

function DeliveryLabelDocument({ data }: { data: DeliveryLabelData }) {
  const shortId = data.orderId.slice(-6).toUpperCase();
  const addressLine = `${data.deliveryAddress}, ${data.deliveryAddressNumber || "S/N"}`;
  const cityLine = data.cityName
    ? `${data.deliveryNeighboorhood} - ${data.cityName}/${data.cityUf}`
    : data.deliveryNeighboorhood;
  const zipFormatted = data.deliveryZipCode.padStart(8, "0");
  const cep = `${zipFormatted.slice(0, 5)}-${zipFormatted.slice(5)}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.card}>
          <Image src={watermarkSrc} style={styles.watermark} />

          {/* Header */}
          <View style={styles.header}>
            <Image src={logoSrc} style={styles.headerLogo} />
            <View>
              <Text style={styles.headerBrand}>FLORES NOBRE</Text>
              <Text style={styles.headerOrderId}>Pedido #{shortId}</Text>
            </View>
          </View>

          <View style={styles.mainSeparator} />

          {/* ENTREGAR PARA */}
          <Text style={styles.sectionLabel}>ENTREGAR PARA</Text>
          <Text style={styles.recipientName}>{data.honoreeName}</Text>

          <View style={styles.lightSeparator} />

          {/* ENDEREÇO */}
          <Text style={styles.sectionLabel}>ENDEREÇO</Text>
          <Text style={styles.bodyText}>{addressLine}</Text>
          {data.deliveryAddressComplement && (
            <Text style={styles.bodyTextMuted}>
              {data.deliveryAddressComplement}
            </Text>
          )}
          <Text style={styles.bodyText}>{cityLine}</Text>
          <Text style={styles.bodyTextMuted}>CEP: {cep}</Text>

          <View style={styles.lightSeparator} />

          {/* ENTREGA + CONTATO side by side */}
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={styles.sectionLabel}>ENTREGA</Text>
              <Text style={styles.bodyText}>{data.deliveryDate}</Text>
              <Text style={styles.bodyTextMuted}>
                Período: {data.deliveryPeriod}
              </Text>
            </View>
            <View style={styles.halfColumn}>
              <Text style={styles.sectionLabel}>CONTATO</Text>
              <Text style={styles.bodyText}>{data.contactPhone}</Text>
            </View>
          </View>

          {/* OBSERVAÇÕES (condicional) */}
          {data.supplierNote ? (
            <>
              <View style={styles.lightSeparator} />
              <Text style={styles.sectionLabel}>OBSERVAÇÕES</Text>
              <Text style={[styles.bodyText, { lineHeight: 1.3 }]}>
                {data.supplierNote}
              </Text>
            </>
          ) : null}

          <View style={styles.lightSeparator} />

          {/* REMETENTE */}
          <Text style={styles.senderText}>
            Enviado por: {data.senderName}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function buildDeliveryLabelPdf(
  data: DeliveryLabelData,
): Promise<Buffer> {
  const buffer = await renderToBuffer(<DeliveryLabelDocument data={data} />);
  return Buffer.from(buffer);
}
