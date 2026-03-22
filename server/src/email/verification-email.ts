import type { UserUiLanguageCode } from "../common/user-ui-language.js";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ISLAMIC_SALUTATION = "Esselamu alejkum";

type VerificationCopy = {
  subject: string;
  body: string;
  buttonLabel: string;
  linkIntro: string;
  footer: string;
};

const VERIFICATION_COPY: Record<UserUiLanguageCode, VerificationCopy> = {
  en: {
    subject: "Verify your Mekteb account",
    body: "You have been invited to Mekteb. Use the button below to open the activation page and set your password.",
    buttonLabel: "Activate account",
    linkIntro: "If the button does not work, copy and paste this link into your browser:",
    footer: "This link expires in 7 days. If you did not expect this message, you can ignore it.",
  },
  sv: {
    subject: "Bekräfta ditt Mekteb-konto",
    body: "Du har bjudits in till Mekteb. Använd knappen nedan för att öppna aktiveringssidan och välja ditt lösenord.",
    buttonLabel: "Aktivera konto",
    linkIntro: "Om knappen inte fungerar, kopiera och klistra in den här länken i webbläsaren:",
    footer: "Länken gäller i 7 dagar. Om du inte förväntade dig det här meddelandet kan du ignorera det.",
  },
  bs: {
    subject: "Potvrdite svoj Mekteb račun",
    body: "Pozvani ste na Mekteb. Koristite dugme ispod da otvorite stranicu za aktivaciju i postavite lozinku.",
    buttonLabel: "Aktiviraj račun",
    linkIntro: "Ako dugme ne radi, kopirajte i zalijepite ovu vezu u preglednik:",
    footer: "Veza vrijedi 7 dana. Ako niste očekivali ovu poruku, možete je zanemariti.",
  },
};

function islamicGreetingHtml(firstName: string): string {
  const trimmed = firstName.trim();
  return trimmed
    ? `${ISLAMIC_SALUTATION}, ${escapeHtml(trimmed)},`
    : `${ISLAMIC_SALUTATION}.`;
}

function islamicGreetingPlain(firstName: string): string {
  const trimmed = firstName.trim();
  return trimmed ? `${ISLAMIC_SALUTATION}, ${trimmed},` : `${ISLAMIC_SALUTATION}.`;
}

function isLocalDevelopmentFrontendUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    return (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "0.0.0.0" ||
      h === "[::1]"
    );
  } catch {
    return false;
  }
}

let warnedMissingPublicLogoBase = false;

export function buildVerificationEmailContent(args: {
  firstName: string;
  verifyUrl: string;
  language: UserUiLanguageCode;
  logoUrl: string;
}): { subject: string; html: string; text: string } {
  const code = VERIFICATION_COPY[args.language] ?? VERIFICATION_COPY.en;
  const greetingHtml = islamicGreetingHtml(args.firstName);

  const textBody = [
    islamicGreetingPlain(args.firstName),
    "",
    code.body,
    "",
    args.verifyUrl,
    "",
    code.footer,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="${args.language}">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;">
              <img src="${escapeHtml(args.logoUrl)}" alt="Mekteb" width="160" style="display:block;margin:0 auto;max-width:100%;height:auto;"/>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 14px;font-size:17px;line-height:1.45;color:#18181b;">${greetingHtml}</p>
              <p style="margin:0 0 26px;font-size:15px;line-height:1.55;color:#3f3f46;">${code.body}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;text-align:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
              <a href="${escapeHtml(args.verifyUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:10px;">${code.buttonLabel}</a>
              <p style="margin:22px 0 0;font-size:12px;line-height:1.5;color:#71717a;text-align:left;">${code.linkIntro}</p>
              <p style="margin:8px 0 0;font-size:12px;line-height:1.45;color:#52525b;word-break:break-all;text-align:left;">${escapeHtml(args.verifyUrl)}</p>
              <p style="margin:20px 0 0;font-size:12px;line-height:1.45;color:#a1a1aa;text-align:left;">${code.footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: code.subject, html, text: textBody };
}

export function resolveVerificationLogoUrl(frontendUrl: string): string {
  const explicitLogo = process.env.EMAIL_LOGO_URL?.trim();
  if (explicitLogo) return explicitLogo;

  const fe = frontendUrl.replace(/\/$/, "");
  const rawPublic = process.env.EMAIL_PUBLIC_WEB_URL?.trim();
  const publicBase = rawPublic ? rawPublic.replace(/\/$/, "") : "";

  let assetBase = fe;
  if (publicBase && isLocalDevelopmentFrontendUrl(fe)) {
    assetBase = publicBase;
  } else if (isLocalDevelopmentFrontendUrl(fe) && !warnedMissingPublicLogoBase) {
    warnedMissingPublicLogoBase = true;
    console.warn(
      "[email] FRONTEND_URL is a local dev URL; set EMAIL_PUBLIC_WEB_URL (e.g. https://your-app.onrender.com) or EMAIL_LOGO_URL so invitation emails can load the header logo."
    );
  }

  return `${assetBase}/branding/logo-small.svg`;
}
