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
- `CMS_ADMIN_USERNAME` – Loginname für den Admin-Bereich
- `CMS_ADMIN_PASSWORD` – Passwort für den Admin-Bereich
- `CMS_SESSION_SECRET` – Secret zum Signieren der Admin-Session
- `FIREBASE_PROJECT_ID` – Firebase Projekt-ID
- `FIREBASE_CLIENT_EMAIL` – Service-Account E-Mail aus Firebase
- `FIREBASE_PRIVATE_KEY` – Private Key des Service-Accounts
- `FIREBASE_STORAGE_BUCKET` – empfohlen für Datei-Uploads im CMS, nur der reine Bucket-Name, z.B. `mein-projekt.firebasestorage.app` oder `mein-projekt.appspot.com`

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

## CMS / Admin-Bereich

- Login unter `/admin/login`
- Ohne konfigurierte Datenbank werden Inhalte lokal in `.cms/content.json` gespeichert. Das ist nur für lokale Entwicklung sinnvoll.
- Auf Vercel müssen CMS-Änderungen über Firebase Firestore gespeichert werden, da das Dateisystem dort nicht dauerhaft beschreibbar ist.
- Für Firestore werden die drei Firebase-Umgebungsvariablen aus dem Service Account benötigt.
- Für Datei-Uploads im Admin, z.B. auf der 3D-Stand-Seite, sollte zusätzlich `FIREBASE_STORAGE_BUCKET` gesetzt werden.

## Firebase Setup

1. In Firebase Firestore im Produktionsmodus aktivieren.
2. Einen Service Account erzeugen.
3. In Vercel diese Variablen setzen: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
4. `FIREBASE_PRIVATE_KEY` muss in Vercel als kompletter Key gespeichert werden; Zeilenumbrüche werden serverseitig automatisch korrekt verarbeitet.
5. Für Datei-Uploads zusätzlich `FIREBASE_STORAGE_BUCKET` als reinen Bucket-Namen setzen, nicht als `gs://...` oder komplette URL.
6. In Google Cloud dem verwendeten Service Account mindestens `Storage Object Admin` auf dem Bucket oder `Storage Admin` im Projekt geben.
7. Nach dem Setzen neu deployen.

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
