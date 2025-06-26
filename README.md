# Rekentool Kinderopvang

Een moderne webapplicatie voor kinderopvangorganisaties om kinderopvangtoeslag berekeningen uit te voeren.

## 🎯 Ontwikkelplan Status

### ✅ Stap 1: Basisopzet en Authenticatie (VOLTOOID)

Deze implementatie bevat:

### ✅ Backend (Node.js + Express + TypeScript)
- **Authenticatie**: JWT-based login systeem
- **Database**: SQLite met Knex.js voor migraties
- **API**: RESTful endpoints voor auth
- **Beveiliging**: Helmet, CORS, rate limiting
- **Validatie**: Express-validator voor input validatie

### ✅ Frontend (React + TypeScript + Chakra UI)
- **Authenticatie**: Context-based state management
- **Routing**: React Router met protected routes
- **UI**: Moderne interface met Chakra UI
- **API**: Axios voor backend communicatie

### ✅ Database Schema
- **Organisaties**: Kinderopvang organisatie gegevens
- **Users**: Gebruikers met rollen (organisatie_beheerder, superuser)

### ✅ Stap 2: Frontend Basis (Voltooid)
- React applicatie met TypeScript
- Chakra UI voor styling
- Authenticatie flows
- Beheerinterface voor organisaties

### ✅ Stap 3: Publieke Rekentool (Voltooid)
- Publieke kostencalculator voor ouders
- Geen inlogvereiste
- Organisatie-specifieke tarieven
- Verschillende tariefstructuren ondersteuning

### ✅ Stap 4: Multitenancy Uitbreiding (Voltooid)
- **Organisatie Context Middleware**: Automatische identificatie via slug
- **Data Isolatie**: Elke organisatie heeft eigen data
- **Publieke API Endpoints**: `/api/organisaties/public/:slug`
- **Organisatie-specifieke URLs**: `/rekentool/:organisatieSlug`
- **Superuser Functionaliteit**: Beheer van meerdere organisaties
- **Test Interface**: `/test` voor multitenancy demonstratie

#### Nieuwe Organisaties in Database:
- **Zonnebloem** (Amsterdam) - `/rekentool/zonnebloem`
- **Regenboog** (Utrecht) - `/rekentool/regenboog`  
- **Zonnetje** (Eindhoven) - `/rekentool/zonnetje`

### 🔄 Stap 5: Kinderopvangtoeslag Module (Gepland)
- Integratie met kinderopvangtoeslag berekeningen
- Netto kosten calculator voor ouders
- Inkomensafhankelijke berekeningen

### 🔄 Stap 6: Geavanceerde Features (Gepland)
- Rapportage en analytics
- Export functionaliteiten
- Geavanceerde tariefstructuren

## 🚀 Quick Start

### Vereisten
- Node.js 18+ 
- npm

### Installatie

1. **Clone repository**
```bash
git clone <repository-url>
cd rekentool-kinderopvang
```

2. **Backend setup**
```bash
cd backend
npm install
cp .env.example .env
# Configureer database instellingen in .env
npm run migrate
npm run seed
```

3. **Frontend setup**
```bash
cd ../frontend
npm install
cp .env.example .env
# Configureer API URL in .env
```

4. **Start development servers**
```bash
# In project root
npm run dev
```

## 🌐 Multitenancy Gebruik

### Voor Ouders (Publieke Rekentool)
- Ga naar `/rekentool/{organisatie-slug}`
- Bijvoorbeeld: `http://localhost:3007/rekentool/zonnebloem`
- Geen inlog vereist

### Voor Organisatie Beheerders
- Login via `/login`
- Toegang tot eigen organisatie data
- Beheer van opvangvormen en tarieven

### Voor Superusers
- Volledige toegang tot alle organisaties
- Aanmaken van nieuwe organisaties
- Gebruikersbeheer

### Test Interface
- Ga naar `/test` voor multitenancy demonstratie
- Links naar alle beschikbare organisaties

## 🔧 API Endpoints

### Publieke Endpoints
- `GET /api/organisaties/public/:slug` - Organisatie info
- `GET /api/opvangvormen?org=:slug` - Opvangvormen per organisatie
- `GET /api/tarieven?org=:slug` - Tarieven per organisatie

### Beheer Endpoints (Authenticatie vereist)
- `GET /api/opvangvormen/beheer` - Beheer opvangvormen
- `GET /api/tarieven/beheer` - Beheer tarieven

### Superuser Endpoints
- `GET /api/organisaties` - Alle organisaties
- `POST /api/organisaties` - Nieuwe organisatie aanmaken

## 🏗️ Technische Architectuur

### Backend
- **Express.js** met TypeScript
- **PostgreSQL** database
- **Knex.js** query builder en migraties
- **JWT** authenticatie
- **bcrypt** wachtwoord hashing

### Frontend  
- **React 18** met TypeScript
- **Chakra UI** component library
- **React Router** voor routing
- **Context API** voor state management

### Database Schema
- `organisaties` - Organisatie informatie en slugs
- `users` - Gebruikers met organisatie koppeling
- `opvangvormen` - Organisatie-specifieke opvangvormen
- `tarieven` - Organisatie-specifieke tariefstructuren

## 🔒 Beveiliging

- JWT tokens voor authenticatie
- Rol-gebaseerde autorisatie (organisatie_beheerder, superuser)
- Data isolatie per organisatie
- Input validatie en sanitization
- CORS configuratie

## 📱 Responsive Design

De applicatie is volledig responsive en werkt op:
- Desktop computers
- Tablets
- Mobiele telefoons

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests  
cd frontend
npm test
```

## 📦 Deployment

### Production Build
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Environment Variables
Zie `.env.example` bestanden voor vereiste configuratie.

## 🤝 Contributing

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/nieuwe-functie`)
3. Commit je wijzigingen (`git commit -am 'Voeg nieuwe functie toe'`)
4. Push naar de branch (`git push origin feature/nieuwe-functie`)
5. Open een Pull Request

## 📄 Licentie

Dit project is gelicenseerd onder de MIT Licentie - zie het [LICENSE](LICENSE) bestand voor details.

## 📦 Installatie

### Vereisten
- Node.js 18+ 
- npm

### Setup
```bash
# Installeer alle dependencies
npm run install:all

# Start development servers (backend + frontend)
npm run dev
```

### Handmatige setup
```bash
# Backend
cd backend
npm install
npm run build
npm run migrate
npm run seed
npm run dev

# Frontend (in nieuwe terminal)
cd frontend
npm install
npm start
```

## 🔑 Test Accounts

### Organisatie Beheerder
- **Email**: admin@zonnebloem.nl
- **Wachtwoord**: password123
- **Rol**: Organisatie beheerder voor "Kinderopvang De Zonnebloem"

### Superuser
- **Email**: superuser@admin.nl  
- **Wachtwoord**: superadmin123
- **Rol**: Superuser (toegang tot alle organisaties)

## 🌐 URLs

- **Frontend**: http://localhost:3007
- **Backend API**: http://localhost:5007/api
- **Health Check**: http://localhost:5007/health

## 📁 Projectstructuur

```
rekentool-kinderopvang/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth & validation middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── migrations/      # Database migrations
│   │   ├── seeds/           # Test data
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utilities
│   ├── database.sqlite      # SQLite database
│   └── package.json
├── frontend/                # React web app
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
│   └── package.json
└── package.json             # Root package.json
```

## 🚧 Volgende Stappen

Volgens het ontwikkelplan komen hierna:

1. **Stap 2**: Kinderopvang gegevensbeheer
2. **Stap 3**: Basis rekenmodule kinderopvangtoeslag  
3. **Stap 4**: Geavanceerde berekeningen
4. **Stap 5**: Rapportage en export
5. **Stap 6**: Gebruikersbeheer en organisatie-instellingen

## 🐛 Troubleshooting

### Backend start niet
```bash
cd backend
npm run build
npm run migrate
```

### Frontend compile errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database reset
```bash
cd backend
rm database.sqlite
npm run migrate
npm run seed
```

## 📝 Ontwikkeling

### Nieuwe migratie toevoegen
```bash
cd backend
npx knex migrate:make migration_name
```

### Database seeding
```bash
cd backend
npm run seed
```

### Build voor productie
```bash
npm run build
```