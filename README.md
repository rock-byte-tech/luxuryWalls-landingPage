# Luxury Walls Landing

Landing page built with Astro + Tailwind.  
The contact form is a Vue component and sends leads to Brevo using an Astro API route (`/api/contact`).

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

## Contact Form Stack

- Frontend: `src/components/ContactForm.vue`
- Section mount: `src/sections/Contact.astro`
- Backend endpoint: `src/pages/api/contact.ts`
- Endpoint URL used by default: `/api/contact`

## Brevo Environment Variables

Create these variables in Netlify (Site settings > Environment variables):

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL` (must be a verified Brevo sender)
- `BREVO_SENDER_NAME`
- `BREVO_RECEIVER_EMAIL`

Local reference file:

- `.env.example`

## Local Testing Notes

The form posts to the Astro API route `/api/contact`.  
For local testing, `pnpm dev` is enough.
