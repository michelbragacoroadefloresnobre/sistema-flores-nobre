import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().min(1),
    REDIS_KANBAN_CACHE_KEY: z.string().min(1),
    AWS_REGION: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    S3_BUCKET_NAME: z.string().min(1),
    PAGARME_API_BASE: z.url(),
    PAGARME_SECRET_KEY: z.string().min(1),

    HELENA_TOKEN: z.string().min(1),
    ZAPI_CLIENT_TOKEN: z.string().min(1),
    ZAPI_INSTANCE: z.string().min(1),
    ZAPI_TOKEN: z.string().min(1),

    N8N_URL: z.url(),
  },
  client: {
    NEXT_PUBLIC_WEBSITE_URL: z.string().min(1),
    NEXT_PUBLIC_INTERNAL_SUPPLIER_JID: z.string().min(1),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_INTERNAL_SUPPLIER_JID:
      process.env.NEXT_PUBLIC_INTERNAL_SUPPLIER_JID,
    NEXT_PUBLIC_WEBSITE_URL: process.env.NEXT_PUBLIC_WEBSITE_URL,
  },
});

export const SP_TIMEZONE = "America/Sao_Paulo";

export const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export enum CNPJ {
  FN = "51.633.347/0001-02",
}
