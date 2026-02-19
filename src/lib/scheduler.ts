import axios from "axios";
import { env } from "./env";

const n8n = axios.create({
  baseURL: env.N8N_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function scheduleUrlCall(data: {
  triggerAt?: Date;
  triggerIn?: number;
  url: string;
  data?: object;
}) {
  await n8n.post("/webhook/schedule", data);
}
