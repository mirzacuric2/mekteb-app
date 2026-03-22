import nodemailer from "nodemailer";

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(payload: MailPayload) {
  const logPrefix = "[email]";
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "Mekteb App <no-reply@mekteb.app>";
  const debugEnabled = process.env.SMTP_DEBUG === "true";

  if (!host || !user || !pass) {
    const missing: string[] = [];
    if (!host) missing.push("SMTP_HOST");
    if (!user) missing.push("SMTP_USER");
    if (!pass) missing.push("SMTP_PASS");
    console.warn(`${logPrefix} disabled - missing config: ${missing.join(", ")}`);
    console.info(`${logPrefix} skipped`, { to: payload.to, subject: payload.subject });
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    logger: debugEnabled,
    debug: debugEnabled,
  });

  try {
    console.info(`${logPrefix} sending`, {
      to: payload.to,
      subject: payload.subject,
      host,
      port,
      secure: port === 465,
    });

    await transporter.verify();
    const info = await transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      ...(payload.text ? { text: payload.text } : {}),
    });

    console.info(`${logPrefix} sent`, {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      pending: info.pending,
      response: info.response,
    });
    return true;
  } catch (error: unknown) {
    const err = error as {
      message?: string;
      code?: string;
      command?: string;
      response?: string;
      responseCode?: number;
    };
    console.error(`${logPrefix} send failed`, {
      to: payload.to,
      subject: payload.subject,
      message: err?.message || "Unknown error",
      code: err?.code,
      command: err?.command,
      responseCode: err?.responseCode,
      response: err?.response,
    });
    return false;
  }
}
