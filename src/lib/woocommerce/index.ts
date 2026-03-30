import axios from "axios";
import createHttpError from "http-errors";
import { env } from "@/lib/env";
import {
  CreateWooCouponInput,
  UpdateWooCouponInput,
  WooCouponResponse,
} from "./types";

const credentials = Buffer.from(
  `${env.WOOCOMMERCE_CONSUMER_KEY}:${env.WOOCOMMERCE_CONSUMER_SECRET}`,
).toString("base64");

const wooApi = axios.create({
  baseURL: `${env.WOOCOMMERCE_URL}/wp-json/wc/v3`,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Basic ${credentials}`,
  },
});

wooApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (!original) return Promise.reject(error);

    if (!original._retryCount) original._retryCount = 0;

    if (error.response?.status === 429) {
      const attempt = original._retryCount;

      if (attempt >= 5) {
        return Promise.reject(
          new createHttpError.TooManyRequests(
            "WooCommerce rate limit excedido após múltiplas tentativas",
          ),
        );
      }

      const delayMs = 1000 * (attempt + 1);

      console.warn(
        `[WooCommerce API] 429 recebido. Tentativa ${attempt + 1} após ${delayMs}ms`,
      );

      await new Promise((r) => setTimeout(r, delayMs));

      original._retryCount++;

      return wooApi(original);
    }

    return Promise.reject(error);
  },
);

export async function createWooCoupon(
  data: CreateWooCouponInput,
): Promise<WooCouponResponse> {
  const response = await wooApi.post("/coupons", data);
  return response.data;
}

export async function updateWooCoupon(
  wooId: number,
  data: UpdateWooCouponInput,
): Promise<WooCouponResponse> {
  const response = await wooApi.put(`/coupons/${wooId}`, data);
  return response.data;
}

export async function deleteWooCoupon(wooId: number): Promise<void> {
  await wooApi.delete(`/coupons/${wooId}`, { params: { force: true } });
}
