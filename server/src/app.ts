import express from "express";
import cors from "cors";
import morgan from "morgan";
import { authRouter } from "./modules/auth/router.js";
import { usersRouter } from "./modules/users/router.js";
import { communicationRouter } from "./modules/communication/router.js";
import { communitiesRouter } from "./modules/communities/router.js";

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

  app.use((_error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    return res.status(500).json({ message: "Internal server error" });
  });

  return app;
}
