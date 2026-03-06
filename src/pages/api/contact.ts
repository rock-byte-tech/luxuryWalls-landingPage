import type { APIRoute } from "astro";

export const prerender = false;

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const messages = {
    missingEnv: "Brevo environment variables are not configured.",
    invalidJson: "Invalid JSON payload.",
    missingFields: "name, email, and message are required.",
    invalidEmail: "Invalid email address.",
    sendError: "Could not send the email.",
    serverError: "Error processing the request.",
    subject: "New inquiry from",
    title: "New Contact Inquiry",
    nameLabel: "Name",
    emailLabel: "Email",
    phoneLabel: "Phone",
    serviceLabel: "Service",
    messageLabel: "Message",
} as const;

const escapeHtml = (value: string) =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

export const POST: APIRoute = async ({ request }) => {
    const { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, BREVO_RECEIVER_EMAIL } =
        import.meta.env;
    const senderName = BREVO_SENDER_NAME ?? "Luxury Walls Naples";
    const t = messages;

    if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL || !BREVO_RECEIVER_EMAIL) {
        return new Response(JSON.stringify({ error: t.missingEnv }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: t.invalidJson }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const name = String(body.name ?? body.nombre ?? "").trim();
        const email = String(body.email ?? "").trim();
        const phone = String(body.phone ?? "").trim();
        const service = String(body.service ?? "").trim();
        const message = String(body.message ?? body.mensaje ?? "").trim();

        if (!name || !email || !message) {
            return new Response(JSON.stringify({ error: t.missingFields }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!EMAIL_REGEX.test(email)) {
            return new Response(JSON.stringify({ error: t.invalidEmail }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const payload = {
            sender: { email: BREVO_SENDER_EMAIL, name: senderName },
            to: [{ email: BREVO_RECEIVER_EMAIL }],
            replyTo: { email, name },
            subject: `${t.subject} ${name}`,
            htmlContent: `
                <h2>${t.title}</h2>
                <p><strong>${t.nameLabel}:</strong> ${escapeHtml(name)}</p>
                <p><strong>${t.emailLabel}:</strong> ${escapeHtml(email)}</p>
                <p><strong>${t.phoneLabel}:</strong> ${escapeHtml(phone || "Not provided")}</p>
                <p><strong>${t.serviceLabel}:</strong> ${escapeHtml(service || "Not selected")}</p>
                <p><strong>${t.messageLabel}:</strong></p>
                <p>${escapeHtml(message).replaceAll("\n", "<br/>")}</p>
            `,
            textContent: `Name: ${name}
                Email: ${email}
                Phone: ${phone || "Not provided"}
                Service: ${service || "Not selected"}
                Message: ${message}`,
        };

        const brevoResponse = await fetch(BREVO_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": BREVO_API_KEY,
            },
            body: JSON.stringify(payload),
        });

        if (!brevoResponse.ok) {
            const errText = await brevoResponse.text();
            return new Response(JSON.stringify({ error: t.sendError, detail: errText }), {
                status: 502,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch {
        return new Response(JSON.stringify({ error: t.serverError }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
