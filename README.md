# Botanikum Stammblatt

FileMaker-ähnliche Stammblatt-App für Botanikum.

## Lokal starten (Demo-Modus)

```bash
npm install
npm run dev
```

Ohne `.env.local` läuft die App im Demo-Modus mit Beispieldaten.

## Produktion: Vercel + Supabase

### 1. Supabase vorbereiten

1. Öffne dein **bestehendes Supabase-Projekt** (gleiches wie Gärtnerei-App)
2. **SQL Editor** → New query → Inhalt von `botanikum_supabase_setup.sql` einfügen → **Run**
3. Unter **Project Settings → API** URL und `anon`/`publishable` Key kopieren

### 2. Lokal mit echter DB testen

```bash
cp .env.example .env.local
# Werte eintragen, dann:
npm run dev
```

Login mit dem **gleichen Nutzer** wie in der Gärtnerei-App.

### 3. Auf Vercel deployen

1. Repo auf GitHub pushen
2. [vercel.com](https://vercel.com) → **Add New Project** → Repo auswählen
3. Build Settings (automatisch erkannt):
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables** hinzufügen:
   - `VITE_SUPABASE_URL` = deine Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = dein Anon/Publishable Key
5. **Deploy** klicken

### Tabellen

Die Stammblatt-App nutzt eigene Tabellen (`stammblatt_*`), damit die Gärtnerei-App unberührt bleibt:

| Tabelle | Zweck |
|---------|-------|
| `stammblatt_kunden` | Kunden-Stammblätter |
| `stammblatt_positionen` | Pflanzen-Positionen |
| `stammblatt_touren` | Touren |
| `stammblatt_tour_kunden` | Tour ↔ Kunde |
| `stammblatt_formular_felder` | Custom Fields Schema |
| `stammblatt_kunden_felder` | Custom Field Werte |

