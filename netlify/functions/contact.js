const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const {
    BREVO_API_KEY,
    BREVO_SENDER_EMAIL,
    BREVO_SENDER_NAME = "Luxury Walls Naples",
    BREVO_RECEIVER_EMAIL,
  } = process.env;

  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL || !BREVO_RECEIVER_EMAIL) {
    return jsonResponse(500, { error: "Brevo environment variables are not configured." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload." });
  }

  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const phone = String(payload.phone || "").trim();
  const service = String(payload.service || "").trim();
  const message = String(payload.message || "").trim();

  if (!name || !email || !message) {
    return jsonResponse(400, { error: "name, email, and message are required." });
  }

  if (!EMAIL_REGEX.test(email)) {
    return jsonResponse(400, { error: "Invalid email address." });
  }

  const htmlContent = `
    <h2>New Contact Inquiry</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
    <p><strong>Service:</strong> ${escapeHtml(service || "Not selected")}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replaceAll("\n", "<br/>")}</p>
  `;

  const brevoPayload = {
    sender: {
      email: BREVO_SENDER_EMAIL,
      name: BREVO_SENDER_NAME,
    },
    to: [{ email: BREVO_RECEIVER_EMAIL }],
    replyTo: {
      email,
      name,
    },
    subject: `New inquiry from ${name}`,
    htmlContent,
    textContent: `Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}
Service: ${service || "Not selected"}
Message: ${message}`,
  };

  try {
    const brevoResponse = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(brevoPayload),
    });

    if (!brevoResponse.ok) {
      const brevoError = await brevoResponse.text();
      return jsonResponse(502, {
        error: "Brevo request failed.",
        detail: brevoError,
      });
    }

    return jsonResponse(200, { ok: true });
  } catch (error) {
    return jsonResponse(500, {
      error: "Unexpected error while sending inquiry.",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
