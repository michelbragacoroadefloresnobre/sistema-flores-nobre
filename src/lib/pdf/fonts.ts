import { Font } from "@react-pdf/renderer";
import path from "path";

const fontsDir = path.join(process.cwd(), "public/fonts");

Font.register({
  family: "PlayfairDisplay",
  fonts: [
    {
      src: path.join(fontsDir, "PlayfairDisplay-Bold.ttf"),
      fontWeight: "bold",
    },
  ],
});

Font.register({
  family: "Poppins",
  fonts: [
    { src: path.join(fontsDir, "Poppins-Regular.ttf"), fontWeight: "normal" },
    {
      src: path.join(fontsDir, "Poppins-Italic.ttf"),
      fontStyle: "italic",
    },
  ],
});
