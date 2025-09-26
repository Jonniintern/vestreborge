# 🏷️ Vestre Borge Gård - Etikett-generator

En profesjonell webasert etikett-generator hvor kunder kan lage egne produktetiketter som sendes til deg for utskrift.

## ✨ Funksjoner

- **Intuitiv design-grensesnitt** - Enkelt å bruke på mobil og desktop
- **Produktinformasjon** - Tittel, navn, telefon
- **Bakgrunnsbilder** - Last opp egne bilder
- **12+ klistremerker** - Frukt, øko-symboler, kvalitetsmerker
- **Høy eksport-kvalitet** - PNG (300 DPI) og PDF (7,6×10,2 cm)
- **Automatisk varsling** - E-post når nye etiketter kommer inn
- **Database-lagring** - Alle bestillinger lagres trygt
- **Admin-panel** - Oversikt over bestillinger (tilgjengelig via API)

## 🚀 Kom i gang

### 1. Installasjon

```bash
# Klon/last ned prosjektet
cd etikett-generator

# Installer avhengigheter
npm install

# Kopier miljøvariabler
cp .env.example .env
```

### 2. Konfigurasjon

Rediger `.env`-filen for å sette opp:

- **E-post varsling** (valgfritt men anbefalt)
- **Port og domener**
- **SMTP-innstillinger**

### 3. Start serveren

```bash
# Produksjon
npm start

# Utvikling (auto-restart)
npm run dev
```

Nettsiden er nå tilgjengelig på: `http://localhost:3000`

## 📧 E-post konfigurasjon

For automatiske varsler når kunder sender inn etiketter:

1. Opprett et app-passord i Gmail (anbefalt)
2. Fyll inn SMTP-detaljer i `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=din-epost@gmail.com
SMTP_PASS=ditt-app-passord
NOTIFICATION_EMAIL=bestillinger@vestreborge.no
```

## 🔧 API-endepunkter

### Kunde-endepunkter
- `POST /api/submit-label` - Send inn ny etikett
- `GET /health` - Helsesjekk

### Admin-endepunkter
- `GET /api/submissions` - Liste alle bestillinger
- `PUT /api/submissions/:id` - Oppdater bestillingsstatus
- `GET /uploads/:filename` - Vis etikett-fil

## 📁 Filstruktur

```
etikett-generator/
├── index.html          # Hovedapplikasjon (frontend)
├── server.js           # Backend server
├── package.json        # Node.js avhengigheter
├── .env.example        # Miljøvariabler eksempel
├── uploads/            # Opplastede etiketter (opprettet automatisk)
├── etiketter.db        # SQLite database (opprettet automatisk)
└── README.md           # Denne filen
```

## 🖥️ Deployment

### Lokal server (utviklng/testing)
```bash
npm start
```

### Produksjon (VPS/cloud)

1. **Last opp filene** til din server
2. **Installer Node.js** (v16+)
3. **Kjør installasjon**:
   ```bash
   npm install --production
   ```
4. **Sett opp prosessbehandler**:
   ```bash
   # Med PM2
   npm install -g pm2
   pm2 start server.js --name "etikett-generator"
   pm2 startup
   pm2 save
   ```

5. **Sett opp reverse proxy** (Nginx/Apache)
6. **SSL-sertifikat** (Let's Encrypt anbefalt)

### Eksempel Nginx-konfigurasjon:
```nginx
server {
    listen 80;
    server_name etikett.vestreborge.no;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔒 Sikkerhet

- **Helmet.js** - HTTP-sikkerhet
- **CORS** - Kryssdomene-kontroll  
- **Filvalidering** - Kun PNG-filer
- **Størrelsesbegrensning** - Maks 10MB filer
- **Input-sanitering** - Beskyttelse mot injeksjon

## 💾 Database

Bruker SQLite for enkelhet. Data lagres i `etiketter.db`:

### Bestillinger-tabell:
- ID, tidspunkt, produktinfo
- Kundeinfo (navn, telefon)
- Fil-sti og status
- Notater for oppfølging

## 🛠️ Utvikling

### Legge til nye klistremerker:
Rediger `STICKERS`-arrayet i `index.html`:

```javascript
{category:'Ny kategori', name:'Nytt ikon', svg:`<svg>...</svg>`}
```

### Endre etikett-størrelse:
Oppdater `EXPORT_W` og `EXPORT_H` konstantene.

### Database-endringer:
Legg til migrasjoner i `server.js` ved oppstart.

## 📞 Support

For spørsmål og support:
- **GitHub Issues** - Tekniske problemer
- **E-post** - Forretningsrelaterte spørsmål

---

## 📋 Lisens

MIT License - Se LICENSE fil for detaljer.

**Laget med ❤️ for Vestre Borge Gård**