# Frigorifico Aurora del Sur - Sistema de Gestion

A professional full-stack management system for a meat processing plant (frigorifico) built with modern web technologies. The application manages clients, daily slaughter records (faenas), payment collections (cobros), inventory/stock, and financial summaries with charts and exportable reports.

## Features

### Core Functionality
- **Client Management** - Add, edit, delete clients with pricing and payment frequency
- **Faena Registration** - Daily slaughter records with quantity, unit price, and auto-calculated totals
- **Payment Tracking** - Record collections with automatic balance validation (prevents over-payment)
- **Inventory/Stock** - Track stock levels with low-stock alerts, entry/exit movements
- **Financial Dashboard** - Monthly and historical summaries with charts (Pie & Bar)
- **Export Reports** - Generate PDF and Excel reports from the Resumen tab
- **Authentication** - Secure login system with session management

### Design
- Warm leather & wood grain aesthetic theme
- Responsive design (desktop + mobile)
- Toast notifications for all actions
- Premium data tables with hover effects and conditional styling
- Interactive charts using Recharts

## Tech Stack

### Frontend
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui components
- Recharts (charts)
- Lucide React (icons)
- date-fns (date formatting)
- jsPDF + jspdf-autotable (PDF export)
- xlsx (Excel export)

### Backend
- Hono (HTTP framework)
- tRPC 11 (type-safe API)
- Drizzle ORM (database)
- MySQL (database)
- OAuth 2.0 authentication

## Getting Started

### Prerequisites
- Node.js 20+
- MySQL database (or use the provided cloud instance)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd frigorifico-aurora-del-sur
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up the database**
```bash
npm run db:push
```

4. **Seed sample data (optional)**
```bash
npx tsx db/seed.ts
```

5. **Start the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

This creates optimized output in `dist/`.

```bash
npm start
```

Starts the production server.

## Project Structure

```
frigorifico-aurora-del-sur/
  api/                    # Backend API
    routers/              # tRPC routers
      client-router.ts    # Client CRUD
      faena-router.ts     # Faena CRUD
      payment-router.ts   # Payment/cobros CRUD
      summary-router.ts   # Dashboard summaries
      inventory-router.ts # Inventory/stock CRUD
    auth-router.ts        # Authentication router
    middleware.ts         # tRPC middleware (auth, roles)
    context.ts            # Request context
    router.ts             # Main router
    boot.ts               # Hono app entry
  contracts/              # Shared types
  db/                     # Database
    schema.ts             # Table definitions
    seed.ts               # Sample data
    migrations/           # DB migrations
  src/
    pages/
      Home.tsx            # Main dashboard
      Login.tsx           # Login page
      NotFound.tsx        # 404 page
    hooks/
      useAuth.ts          # Auth hook
      useToast.ts         # Toast notifications
    providers/
      trpc.tsx            # tRPC client provider
    components/ui/        # shadcn/ui components
  index.html
  vite.config.ts
  drizzle.config.ts
  tailwind.config.js
```

## Database Schema

### clients
| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | Auto-increment ID |
| name | varchar(255) | Client name (unique) |
| price | real | Price per unit in Bs |
| frequency | enum | Diario/Semanal/Quincenal/Mensual |
| createdAt | timestamp | Creation date |

### faenas
| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | Auto-increment ID |
| clientId | bigint FK | Reference to client |
| date | varchar(10) | ISO date YYYY-MM-DD |
| quantity | int | Number of animals |
| unitPrice | real | Price per unit |
| createdAt | timestamp | Creation date |

### cobros
| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | Auto-increment ID |
| clientId | bigint FK | Reference to client |
| date | varchar(10) | ISO date YYYY-MM-DD |
| amount | real | Payment amount in Bs |
| description | text | Payment description |
| createdAt | timestamp | Creation date |

### inventory
| Column | Type | Description |
|--------|------|-------------|
| id | serial PK | Auto-increment ID |
| name | varchar(255) | Item name |
| category | enum | ganado/carne/general |
| quantity | int | Current stock |
| unit | enum | unidad/kg/cabezas |
| minStock | int | Alert threshold |
| createdAt | timestamp | Creation date |

## API Endpoints (tRPC)

| Router | Procedure | Type | Description |
|--------|-----------|------|-------------|
| clients | list | query | List all clients (with search) |
| clients | byId | query | Get client by ID |
| clients | create | mutation | Create new client |
| clients | update | mutation | Update client |
| clients | delete | mutation | Delete client |
| faena | list | query | List faenas (with filters) |
| faena | create | mutation | Create faena record |
| faena | update | mutation | Update faena |
| faena | delete | mutation | Delete faena |
| payment | list | query | List payments (with filters) |
| payment | create | mutation | Record payment (validates balance) |
| payment | delete | mutation | Delete payment |
| summary | monthly | query | Monthly aggregated data |
| summary | historical | query | Lifetime aggregated data |
| summary | dashboard | query | Key metrics + alerts |
| inventory | list | query | List inventory items |
| inventory | create | mutation | Create inventory item |
| inventory | update | mutation | Update item |
| inventory | delete | mutation | Delete item |
| inventory | movement | mutation | Stock entry/exit |
| inventory | logs | query | Movement history |

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | MySQL connection string |
| VITE_APP_ID | App ID for OAuth |
| VITE_KIMI_AUTH_URL | Kimi auth URL |

## Deployment

The project is configured for deployment with:
- `npm run build` - Creates production bundle
- `npm start` - Starts production server on port 3000

Make sure your environment variables are set in production.

## License

MIT
