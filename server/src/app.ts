import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { authRouter } from "./modules/auth/router.js";
import { usersRouter } from "./modules/users/router.js";
import { communicationRouter } from "./modules/communication/router.js";
import { communitiesRouter } from "./modules/communities/router.js";

type ApiError = Error & {
  code?: string;
  status?: number;
  statusCode?: number;
  type?: string;
};

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

function isJsonBodyParseError(error: unknown): error is ApiError {
  return (
    error instanceof SyntaxError &&
    (error as ApiError).type === "entity.parse.failed" &&
    typeof (error as ApiError).status === "number"
  );
}

function toSafeErrorResponse(error: unknown) {
  if (isJsonBodyParseError(error)) {
    return {
      status: HTTP_STATUS_BAD_REQUEST,
      message: "Invalid JSON body",
      code: "INVALID_JSON_BODY",
      stack: (error as Error).stack,
    };
  }

  if (error instanceof Error) {
    const apiError = error as ApiError;
    const status = apiError.statusCode ?? apiError.status ?? HTTP_STATUS_INTERNAL_SERVER_ERROR;
    const validStatus =
      status >= HTTP_STATUS_BAD_REQUEST && status < 600 ? status : HTTP_STATUS_INTERNAL_SERVER_ERROR;

    return {
      status: validStatus,
      message: apiError.message || "Internal server error",
      code: apiError.code,
      stack: apiError.stack,
    };
  }

  return {
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    message: "Internal server error",
    code: undefined,
    stack: undefined,
  };
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/auth", authRouter());
  app.use("/", communitiesRouter());
  app.use("/", usersRouter());
  app.use("/", communicationRouter());

  app.use((_req: Request, res: Response) => {
    return res.status(HTTP_STATUS_NOT_FOUND).json({ message: "Not found" });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const safeError = toSafeErrorResponse(error);
    const isServerError = safeError.status >= HTTP_STATUS_INTERNAL_SERVER_ERROR;
    const message = isServerError ? "Internal server error" : safeError.message;

    if (isServerError) {
      console.error("[api-error]", {
        status: safeError.status,
        code: safeError.code,
        message: safeError.message,
        stack: safeError.stack,
      });
    }

    return res.status(safeError.status).json({
      message,
      ...(safeError.code ? { code: safeError.code } : {}),
    });
  });

  return app;
}
