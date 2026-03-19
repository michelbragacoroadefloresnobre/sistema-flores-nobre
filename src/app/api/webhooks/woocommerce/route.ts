import { handleWooOrderCreated } from "@/modules/woocommerce/woocommerce.service";
import { isHttpError } from "http-errors";
import { NextResponse } from "next/server";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
}

export async function POST(request: Request) {
  try {
 const body = await request.json();
 console.log(body)
    const order = await handleWooOrderCreated(body);

    return NextResponse.json({
      success: true,
      data: { id: order?.id },
    });
  
} catch (error) {
    if (!isHttpError(error))
      console.error("Erro desconhecido ao receber pedido do woocommerce:", error);
    return NextResponse.json(
      {
        error: isHttpError(error)
          ? error.message
          : "Algo deu errado. Contate o suporte",
      },
      { headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}