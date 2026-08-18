const nodemailer = require("nodemailer");

// Lazily-created singleton transporter. If SMTP env vars aren't set (e.g.
// local dev without a mail provider configured yet), we fall back to a
// transporter that just logs the message to the console instead of
// throwing — so `forgot password` still "works" for local testing: you
// just copy the reset link out of the server log instead of an inbox.
let transporter = null;
let usingRealSmtp = false;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports (STARTTLS)
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    usingRealSmtp = true;
  } else {
    // Dev fallback — "sends" mail by writing it to stdout.
    transporter = {
      sendMail: async (opts) => {
        console.log("\n──────────────────────────────────────────────────────");
        console.log("✉️  SMTP is not configured (SMTP_HOST/PORT/USER/PASS missing).");
        console.log("   Printing the email instead of sending it:");
        console.log(`   To:      ${opts.to}`);
        console.log(`   Subject: ${opts.subject}`);
        console.log(`   ${opts.text}`);
        console.log("──────────────────────────────────────────────────────\n");
        return { messageId: "dev-console-transport" };
      },
    };
    usingRealSmtp = false;
  }

  return transporter;
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  const from = process.env.SMTP_FROM || "Whiteboard <no-reply@whiteboard.app>";
  const t = getTransporter();

  await t.sendMail({
    from,
    to,
    subject: "Reset your Whiteboard password",
    text:
      `We received a request to reset your Whiteboard password.\n\n` +
      `Reset it here (valid for 1 hour): ${resetUrl}\n\n` +
      `If you didn't request this, you can safely ignore this email — ` +
      `your password will not change.`,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#111827;">Reset your password</h2>
        <p style="color:#374151;">We received a request to reset the password for your Whiteboard account.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(to bottom right, #fb923c, #ec4899); color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Reset Password
          </a>
        </p>
        <p style="color:#6b7280; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#9ca3af; font-size: 12px;">If the button doesn't work, copy and paste this link: <br/>${resetUrl}</p>
      </div>
    `,
  });

  return { usingRealSmtp };
}

module.exports = { sendPasswordResetEmail };
