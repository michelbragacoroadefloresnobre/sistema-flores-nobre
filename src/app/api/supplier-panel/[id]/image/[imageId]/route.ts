import { SupplierPanelPhotoStatus } from "@/generated/prisma/enums";
import { env } from "@/lib/env";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { convertHeicToJpeg } from "@/modules/files/file.service";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import createHttpError from "http-errors";
import z from "zod";

export const POST = createRoute(
  async (req, { params, body }) => {
    const fileUrlResponse = await fetch(
      `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${body.fileKey}`,
    );

    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];

    const contentType = fileUrlResponse.headers.get("Content-Type") || "";

    if (!allowedImageTypes.includes(contentType))
      throw new createHttpError.BadRequest("Formato de imagem incompativel");

    let name = body.fileKey;
    let type = contentType;
    if (type === "image/heic" || type === "image/heif") {
      const fileBuffer = await convertHeicToJpeg(
        await fileUrlResponse.arrayBuffer(),
      );
      name = name.replace(/\.(heic|heif)$/i, ".jpg");
      type = "image/jpeg";
      await s3.send(
        new DeleteObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: body.fileKey,
        }),
      );
      await s3.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: name,
          Body: Buffer.from(fileBuffer),
          ContentType: type,
        }),
      );
    }

    const imageUrl = `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${name}`;

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.supplierPanelPhoto.updateMany({
        data: {
          status: SupplierPanelPhotoStatus.SUBMITTED,
          imageUrl,
        },
        where: {
          status: {
            in: [
              SupplierPanelPhotoStatus.PENDING,
              SupplierPanelPhotoStatus.REJECTED,
            ],
          },
          id: params.imageId,
        },
      });

      if (!count)
        throw new createHttpError.BadRequest("Envio de foto indisponivel");
    });

    return "Foto enviada com sucesso";
  },
  { public: true, body: z.object({ fileKey: z.string().min(1) }) },
);
