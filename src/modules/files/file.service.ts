import { cloudinary } from "@/lib/cloudinary";
import { UploadApiResponse } from "cloudinary";

export async function convertHeicToJpeg(fileBuffer: ArrayBuffer) {
  const result = await new Promise<UploadApiResponse>((resolve, reject) =>
    cloudinary.uploader
      .upload_stream(
        {
          format: "jpg",
        },
        (error, result) => {
          if (error || !result)
            reject(error || "Erro desconhecido ao converter imagem");
          else resolve(result);
        },
      )
      .end(Buffer.from(fileBuffer)),
  );

  const res = await fetch(result.secure_url);
  await cloudinary.uploader.destroy(result.public_id);

  const buffer = await res.arrayBuffer();

  return buffer;
}
