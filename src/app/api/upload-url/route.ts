import { env } from "@/lib/env";
import { createRoute } from "@/lib/handler/route-handler";
import { s3 } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import createHttpError from "http-errors";
import { NextResponse } from "next/server";
import { ulid } from "ulid";
import z from "zod";

export const POST = createRoute(
  async (req, { body }) => {
    const { fileName, contentType } = body;
    const extension = fileName.match(/\.[^.\/]+$/)?.[0];

    if (!extension) throw new createHttpError.BadRequest("Arquivo invalido");

    const unicName = `flores-nobre${body.path || ""}/${ulid()}${extension}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: unicName,
      ContentType: contentType,
    };
    try {
      const uploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand(uploadParams),
        {
          expiresIn: 300,
        },
      );

      return NextResponse.json({
        key: unicName,
        uploadUrl,
        publicUrl: `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${unicName}`,
      });
    } catch (e) {
      console.error("Erro ao gerar url pre assinada:", e);
      return NextResponse.json({
        error: "Algo deu errado",
      });
    }
  },
  {
    public: true,
    body: z.object({
      fileName: z.string().min(1),
      path: z.string().optional(),
      contentType: z.string().min(1),
    }),
  },
);
