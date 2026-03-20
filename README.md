# Headbang Handwerk

> Handwerk trifft Metal – Wir bringen das Handwerk auf die lautesten Festivals Europas.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Sprache:** TypeScript
- **Styling:** Tailwind CSS v4
- **Zahlungen:** Stripe
- **Deployment:** Vercel

## Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env.local
```

Dann die Werte in `.env.local` eintragen:
- `STRIPE_SECRET_KEY` – Stripe Secret Key (aus Stripe Dashboard)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` – Stripe Public Key
- `STRIPE_WEBHOOK_SECRET` – Stripe Webhook Secret
- `NEXT_PUBLIC_APP_URL` – URL der App (z.B. `https://headbang-handwerk.com`)

### 3. Development Server starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## Stripe Webhook (lokal testen)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Deployment auf Vercel

1. Repository bei Vercel verbinden
2. Umgebungsvariablen in Vercel setzen
3. Deploy!

## Seiten

| Route | Beschreibung |
|-------|-------------|
| `/` | Startseite |
| `/veranstaltungen` | Festival-Termine |
| `/sponsoren` | Sponsoring-Pakete |
| `/sponsoren/checkout` | Sponsoring bezahlen |
| `/merchandise` | Merch-Shop |
| `/drei-d-stand` | 3D-Stand & Bannerflächen |
| `/ueber-uns` | Über uns |
| `/kontakt` | Kontaktformular |
| `/impressum` | Impressum |
| `/datenschutz` | Datenschutz |
| `/agb` | AGB |

## Rechtlicher Hinweis

Headbang Handwerk ist kein eingetragener gemeinnütziger Verein. Steuerlich absetzbare
Spendenquittungen können nicht ausgestellt werden. Bei Sponsoring-Zahlungen wird eine
Zahlungsbestätigung ausgestellt.
