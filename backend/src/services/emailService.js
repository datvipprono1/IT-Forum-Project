const nodemailer = require("nodemailer");

let cachedTransporter = null;

function createConfigError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function buildTransportOptions() {
  const service = process.env.SMTP_SERVICE?.trim();
  const host = process.env.SMTP_HOST?.trim();
  const portValue = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!user || !pass) {
    throw createConfigError(
      "SMTP_NOT_CONFIGURED",
      "Chức năng quên mật khẩu chưa được cấu hình SMTP trên server."
    );
  }

  if (service) {
    return {
      service,
      auth: {
        user,
        pass,
      },
    };
  }

  if (!host) {
    throw createConfigError(
      "SMTP_NOT_CONFIGURED",
      "Thiếu SMTP_HOST hoặc SMTP_SERVICE để gửi email quên mật khẩu."
    );
  }

  const port = Number.parseInt(portValue || "587", 10);
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  };
}

function getTransporter() {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport(buildTransportOptions());
  }

  return cachedTransporter;
}

function resolveFromAddress() {
  const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim();

  if (!from) {
    throw createConfigError(
      "SMTP_NOT_CONFIGURED",
      "Thiếu SMTP_FROM hoặc SMTP_USER để gửi email quên mật khẩu."
    );
  }

  return from;
}

async function sendPasswordResetLinkEmail({
  to,
  recipientName = "",
  resetUrl,
  expiresInMinutes = 15,
}) {
  const transporter = getTransporter();
  const from = resolveFromAddress();
  const greeting = recipientName ? `Xin chào ${recipientName},` : "Xin chào,";

  await transporter.sendMail({
    from,
    to,
    subject: "Link đặt lại mật khẩu cho tài khoản DNTU Forum",
    text: [
      greeting,
      "",
      "Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản DNTU Forum.",
      "Hãy nhấn vào nút Đặt lại mật khẩu trong email này để tạo mật khẩu mới.",
      `Link này có hiệu lực trong ${expiresInMinutes} phút.`,
      "",
      "Nếu email không hiển thị nút, hãy yêu cầu gửi lại link mới.",
      "Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #12335c;">
        <p>${greeting}</p>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản <strong>DNTU Forum</strong>.</p>
        <p>Nhấn vào nút bên dưới để tạo mật khẩu mới:</p>
        <p>
          <a
            href="${resetUrl}"
            style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #155cb4; color: #ffffff; text-decoration: none; font-weight: 700;"
          >
            Đặt lại mật khẩu
          </a>
        </p>
        <p>Link này có hiệu lực trong <strong>${expiresInMinutes} phút</strong>.</p>
        <p>Nếu email của bạn không hiển thị nút, hãy yêu cầu gửi lại link mới.</p>
        <p>Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>
      </div>
    `,
  });
}

module.exports = {
  sendPasswordResetLinkEmail,
};
