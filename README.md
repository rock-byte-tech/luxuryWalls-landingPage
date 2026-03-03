# Luxury Walls Landing

Landing page built with Astro + Tailwind.  
The contact form is now a Vue component and sends leads to Brevo via a Netlify Function.

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
- Backend endpoint: `netlify/functions/contact.js`
- Endpoint URL used by default: `/.netlify/functions/contact`

## Brevo Environment Variables

Create these variables in Netlify (Site settings > Environment variables):

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL` (must be a verified Brevo sender)
- `BREVO_SENDER_NAME`
- `BREVO_RECEIVER_EMAIL`

Local reference file:

- `.env.example`

## Local Testing Notes

The form posts to a Netlify Function.  
If you need to test the full submit flow locally, run with Netlify CLI (`netlify dev`) so `/.netlify/functions/contact` is available.
