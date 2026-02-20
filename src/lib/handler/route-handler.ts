import { Session, User } from "better-auth";
import createHttpError, { isHttpError } from "http-errors";
import { NextRequest, NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { auth } from "../auth";

export type PositiveResponseType = {
  message: string;
  status: number;
  data: any;
};

export type NegativeResponseType = { error: string; status: number };

type RouteContext<B = any, Q = any> = {
  params?: any;
  searchParams: Q;
  body: B;
  auth: {
    session: Session;
    user: User;
  } | null;
};

type HandlerResponseType = { message?: string; data?: Record<string, any> };

type RouteHandler<B, Q> = (
  req: NextRequest,
  context: RouteContext<B, Q>,
) => Promise<NextResponse | Response | string | HandlerResponseType>;

interface RouteOptions<B, Q> {
  public?: boolean;
  body?: ZodSchema<B>;
  searchParams?: ZodSchema<Q>;
  logs?: { suppress?: "RESPONSE"[] };
}

export function createRoute<B = any, Q = any>(
  handler: RouteHandler<B, Q>,
  options: RouteOptions<B, Q> = {},
) {
  return async (req: NextRequest, context: any) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      console.info(`[User] ${session?.user?.name || "Não Autenticado"}`);

      if (!options.public && !session)
        throw createHttpError.Unauthorized("Não autorizado");

      let parsedBody: any = undefined;
      let parsedQuery: any = undefined;

      if (options.body && req.method !== "GET") {
        const json = await req.json();
        console.log(`[RequestBody]`, JSON.stringify(json, null, 2));
        parsedBody = await options.body.parseAsync(json);
      }

      if (options.searchParams) {
        const searchParamsObj = Object.fromEntries(req.nextUrl.searchParams);
        parsedQuery = await options.searchParams.parseAsync(searchParamsObj);
      }

      const res = await handler(req, {
        params: await context.params,
        searchParams: parsedQuery,
        body: parsedBody,
        auth: session,
      });

      if (res instanceof NextResponse || res instanceof Response) return res;

      const statusCode = req.method === "POST" ? 201 : 200;

      let responseData: any = null;

      if (typeof res === "string")
        responseData = { message: res, status: statusCode };
      else {
        const { message, data } = res;

        responseData = {
          message: message || "Operação realizada com sucesso",
          status: req.method === "POST" ? 201 : 200,
          data: data,
        };
      }

      if (
        process.env.NODE_ENV === "development" &&
        !options.logs?.suppress?.includes("RESPONSE")
      )
        console.log(`[ResponseBody] ${JSON.stringify(responseData, null, 2)}`);

      return NextResponse.json(responseData, {
        status: req.method === "POST" ? 201 : 200,
      });
    } catch (error: any) {
      if (isHttpError(error)) {
        console.warn(`[${error.name}] ${error.message}`);
        return NextResponse.json(
          { error: error.message, status: error.statusCode },
          { status: error.statusCode },
        );
      }

      if (error instanceof ZodError) {
        const errors = error.flatten().fieldErrors;
        console.warn(`[${error.name}]`, JSON.stringify(errors, null, 2));
        return NextResponse.json(
          { error: "Campos invalidos", status: 400, errors },
          { status: 400 },
        );
      }

      console.error("[UnexpectedError]", error);

      return NextResponse.json(
        { error: "Algo deu errado", status: 500 },
        { status: 500 },
      );
    }
  };
}
