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

interface TributeCardData {
  senderName: string;
  honoreeName: string;
  tributeCardPhrase: string;
}

const assetsDir = process.cwd();
const logoSrc = path.join(assetsDir, "public/logo.png");
const watermarkSrc = path.join(assetsDir, "public/marca-dagua.png");

const COLORS = {
  brand: "#8B4513",
  title: "#333333",
  body: "#555555",
  muted: "#999999",
  separator: "#cccccc",
};

const styles = StyleSheet.create({
  page: {
    padding: 0,
  },
  card: {
    height: "50%",
    padding: 40,
    position: "relative",
  },
  logo: {
    position: "absolute",
    top: 40,
    right: 40,
    height: 50,
  },
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 280,
    height: 280,
    transform: "translate(-140, -125)",
    opacity: 0.1,
  },
  fromTo: {
    fontFamily: "PlayfairDisplay",
    fontWeight: "bold",
    fontSize: 18,
    color: COLORS.title,
  },
  separator: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.separator,
    marginTop: 10,
    marginBottom: 14,
  },
  phraseContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  footer: {
    alignItems: "center",
  },
  brandName: {
    fontFamily: "PlayfairDisplay",
    fontWeight: "bold",
    fontSize: 13,
    color: COLORS.brand,
  },
  contactInfo: {
    fontFamily: "Poppins",
    fontSize: 8,
    color: COLORS.muted,
    marginTop: 4,
  },
});

function getPhraseFontSize(length: number): number {
  if (length <= 150) return 15;
  if (length <= 400) return 13;
  return 11;
}

function TributeCardDocument({ data }: { data: TributeCardData }) {
  const phraseFontSize = getPhraseFontSize(data.tributeCardPhrase.length);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.card}>
          <Image src={logoSrc} style={styles.logo} />
          <Image src={watermarkSrc} style={styles.watermark} />

          <Text style={styles.fromTo}>De: {data.senderName}</Text>
          <Text style={[styles.fromTo, { marginTop: 4 }]}>
            Para: {data.honoreeName}
          </Text>

          <View style={styles.separator} />

          <View style={styles.phraseContainer}>
            <Text
              style={{
                fontFamily: "PlayfairDisplay",
                fontWeight: "bold",
                fontSize: phraseFontSize,
                color: COLORS.body,
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              {"\u201C"}
              {data.tributeCardPhrase}
              {"\u201D"}
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.brandName}>FLORES NOBRE</Text>
            <Text style={styles.contactInfo}>
              @floresnobre | floresnobre.com.br | 0800 550 0115
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function buildTributeCardPdf(
  data: TributeCardData,
): Promise<Buffer> {
  const buffer = await renderToBuffer(<TributeCardDocument data={data} />);
  return Buffer.from(buffer);
}
