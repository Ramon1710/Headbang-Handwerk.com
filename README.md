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
- `EVENT_SPONSORING_RECIPIENT_EMAIL` – interne Empfaengeradresse fuer veranstaltungsbezogene Sponsoringanfragen
- `ADMIN_SESSION_SECRET` – Secret zum Signieren der Admin-Session
- `HEADBANG_ADMIN_USERNAME` – Loginname für den Headbang-Admin
- `HEADBANG_ADMIN_PASSWORD_HASH` – scrypt-Hash für den Headbang-Admin
- `ZOLLHAUS_ADMIN_USERNAME` – Loginname für den Zollhaus-Admin
- `ZOLLHAUS_ADMIN_PASSWORD_HASH` – scrypt-Hash für den Zollhaus-Admin
- `FIREBASE_PROJECT_ID` – Firebase Projekt-ID
- `FIREBASE_CLIENT_EMAIL` – Service-Account E-Mail aus Firebase
- `FIREBASE_PRIVATE_KEY` – Private Key des Service-Accounts
- `FIREBASE_STORAGE_BUCKET` – empfohlen für Datei-Uploads im CMS, nur der reine Bucket-Name, z.B. `mein-projekt.firebasestorage.app` oder `mein-projekt.appspot.com`
- `ZOLLHAUS_ORDER_EMAIL` – interne Empfängeradresse für Zollhaus-Bestellungen, z.B. `ramon.meyer@hotmail.de`

### Admin-Hashes lokal erzeugen

Die Hashwerte fuer beide Admin-Zugaenge werden lokal mit dem Hilfsskript erzeugt:

```bash
node scripts/generate-admin-password-hash.mjs
```

Das Skript fragt das Passwort verdeckt zweimal ab und gibt ausschliesslich den fertigen Hash im Format `scrypt$N$r$p$salt$hash` aus. Das Passwort selbst wird weder gespeichert noch ausgegeben.

Anschliessend die Werte als Vercel-Umgebungsvariablen hinterlegen:

```bash
npx vercel env add ADMIN_SESSION_SECRET
npx vercel env add HEADBANG_ADMIN_USERNAME
npx vercel env add HEADBANG_ADMIN_PASSWORD_HASH
npx vercel env add ZOLLHAUS_ADMIN_USERNAME
npx vercel env add ZOLLHAUS_ADMIN_PASSWORD_HASH
```

Uebergangsweise akzeptiert der Headbang-Login noch `CMS_ADMIN_USERNAME` und `CMS_ADMIN_PASSWORD`, falls noch kein `HEADBANG_ADMIN_PASSWORD_HASH` gesetzt ist. Dieser Fallback gilt nur serverseitig fuer den Headbang-Admin, nie fuer Zollhaus, und sollte nach erfolgreicher Umstellung entfernt werden.

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

Ein neues Deployment kannst du direkt im Terminal mit der Vercel CLI auslösen.

### 1. Bei Vercel einloggen

```bash
npx vercel login
```

### 2. Projekt mit Vercel verknüpfen

Im Projektordner einmalig ausführen:

```bash
npx vercel
```

Dabei fragt Vercel interaktiv nach Team, Projektname und den Projekteinstellungen. Danach ist das Projekt lokal mit Vercel verbunden.

### 3. Neues Preview-Deployment erstellen

```bash
npx vercel
```

Das erzeugt ein neues Preview-Deployment und gibt dir danach direkt die Deployment-URL im Terminal aus.

### 4. Neues Production-Deployment erstellen

```bash
npx vercel --prod
```

Damit wird sofort ein neues Production-Deployment erstellt.

### 5. Wichtige Umgebungsvariablen in Vercel setzen

Die Variablen kannst du im Vercel-Dashboard setzen oder ebenfalls per Terminal hinzufügen:

```bash
npx vercel env add STRIPE_SECRET_KEY
npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
npx vercel env add STRIPE_WEBHOOK_SECRET
npx vercel env add NEXT_PUBLIC_APP_URL
npx vercel env add EVENT_SPONSORING_RECIPIENT_EMAIL
npx vercel env add ADMIN_SESSION_SECRET
npx vercel env add HEADBANG_ADMIN_USERNAME
npx vercel env add HEADBANG_ADMIN_PASSWORD_HASH
npx vercel env add ZOLLHAUS_ADMIN_USERNAME
npx vercel env add ZOLLHAUS_ADMIN_PASSWORD_HASH
npx vercel env add FIREBASE_PROJECT_ID
npx vercel env add FIREBASE_CLIENT_EMAIL
npx vercel env add FIREBASE_PRIVATE_KEY
npx vercel env add FIREBASE_STORAGE_BUCKET
```

Nach neuen oder geänderten Env-Variablen solltest du erneut deployen:

```bash
npx vercel --prod
```

### Kurzfassung

```bash
cd /workspaces/Headbang-Handwerk.com
npx vercel login
npx vercel
npx vercel --prod
```

## CMS / Admin-Bereich

- Login unter `/admin/login`
- Zusätzlicher Zollhaus-Login unter `/zollhaus/admin/login`
- Ohne konfigurierte Datenbank werden Inhalte lokal in `.cms/content.json` gespeichert. Das ist nur für lokale Entwicklung sinnvoll.
- Auf Vercel müssen CMS-Änderungen über Firebase Firestore gespeichert werden, da das Dateisystem dort nicht dauerhaft beschreibbar ist.
- Für Firestore werden die drei Firebase-Umgebungsvariablen aus dem Service Account benötigt.
- Für Datei-Uploads im Admin, z.B. auf der 3D-Stand-Seite, sollte zusätzlich `FIREBASE_STORAGE_BUCKET` gesetzt werden.
- Das Login-Limit fuer Zollhaus nutzt nach Moeglichkeit Firestore und faellt lokal auf eine Datei unter `.cms/admin-login-limits.json` zurueck.

## Firebase Setup

1. In Firebase Firestore im Produktionsmodus aktivieren.
2. Einen Service Account erzeugen.
3. In Vercel diese Variablen setzen: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
4. `FIREBASE_PRIVATE_KEY` muss in Vercel als kompletter Key gespeichert werden; Zeilenumbrüche werden serverseitig automatisch korrekt verarbeitet.
5. Für Datei-Uploads zusätzlich `FIREBASE_STORAGE_BUCKET` als reinen Bucket-Namen setzen, nicht als `gs://...` oder komplette URL.
6. In Google Cloud dem verwendeten Service Account mindestens `Storage Object Admin` auf dem Bucket oder `Storage Admin` im Projekt geben.
7. Nach dem Setzen neu deployen.

## Zollhaus Datenbasis

Die Zollhaus-Datenebene ist bewusst vollstaendig von Headbang-CMS, Headbang-Merchandise, Headbang-Bestellungen und Stripe-Daten getrennt.

- Produkte: `partnerSites/zollhaus/products/{productId}`
- Bestellungen: `partnerSites/zollhaus/orders/{orderId}`
- Shop-Einstellungen: `partnerSites/zollhaus/settings/shop`
- Idempotente Bestellanfragen: `partnerSites/zollhaus/orderRequests/{idempotencyKey}`

## Event-Sponsoring Anfragen

- Oeffentliche Veranstaltungs-Sponsoringseiten verwenden einen Anfragefluss ohne Stripe-Checkout.
- Sponsoringanfragen werden in Firestore unter `eventSponsoringRequests` gespeichert.
- Optionale Logo- oder PDF-Dateien werden ueber Firebase Storage abgelegt.
- Die interne Benachrichtigung laeuft ueber `EVENT_SPONSORING_RECIPIENT_EMAIL` und SMTP.
- Die Abrechnung erfolgt nach Pruefung manuell per Rechnung.

Die serverseitigen Module dafuer liegen unter `lib/zollhaus/`:

- `types.ts` fuer die getrennten Zollhaus-Domaenmodelle
- `validation.ts` fuer serverseitige Normalisierung und Validierung
- `products.ts` fuer Firestore-Zugriff auf Zollhaus-Produkte
- `orders.ts` fuer Firestore-Zugriff auf Zollhaus-Bestellungen und Idempotency-Requests
- `settings.ts` fuer Firestore-Zugriff auf Zollhaus-Shop-Einstellungen
- `order-number.ts` fuer testbare Zollhaus-Bestellnummern

Diese Module verwenden ausschliesslich die vorhandene Firebase-Admin-Initialisierung, schreiben aber nie in `cms/site`, nie in Headbang-Merchandise-Produkte, nie in bestehende Headbang-Bestellungen und nie in bestehende Stripe-Pfade.

## Zollhaus Bestellmails

Zollhaus-Bestellungen verschicken nach erfolgreicher Speicherung best-effort eine interne SMTP-Mail an die Adresse aus `ZOLLHAUS_ORDER_EMAIL`.

- Betreff: `Neue Zollhaus-Bestellung – {Bestellnummer}`
- Versandziel nur serverseitig aus Umgebungsvariablen, nie aus CMS-Daten
- Bei fehlender SMTP- oder Empfaenger-Konfiguration bleibt die Bestellung erhalten, der Bestand bleibt reduziert und der Mailstatus wird neutral als fehlgeschlagen markiert
- Logs enthalten dabei nur Bestellnummer und reduzierte Fehlerkategorie, keine Kunden-PII
- Doppelte Checkouts erzeugen keine zweite Mail, bereits versendete Bestellungen werden nicht automatisch erneut versendet
- Es wird eine deterministische Message-ID gesetzt, soweit der SMTP-Transport diese uebernimmt
- SMTP kann trotz Claim-Logik keine absolute Exactly-Once-Zustellung garantieren; dokumentiert ist daher eine best-effort Idempotenz innerhalb der Anwendung, nicht ueber alle Mailserver hinweg

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
