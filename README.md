# UAT Forms 🎓

**Plataforma de exámenes y formularios institucionales para la Universidad Autónoma de Tamaulipas**

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express + TypeScript + Prisma ORM |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh tokens) |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| UI | Custom shadcn/ui-compatible components |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| DnD | @dnd-kit |
| Excel | xlsx |
| Realtime | Socket.io |
| Container | Docker + Docker Compose |

## Features

- 🔐 **Auth**: Email domain-based roles (@uat.edu.mx → Profesor, @alumnos.uat.edu.mx → Alumno)
- 📋 **Forms**: Visual drag-and-drop editor with 8 question types
- 📝 **Exams**: Auto-grading with correct answers, time limits, attempt limits
- 👥 **Groups**: Create groups with unique 6-char codes + QR codes
- 📊 **Results**: Charts (Bar + Pie) per question, export to Excel
- 🔔 **Notifications**: Real-time via Socket.io
- 🐳 **Docker**: Full containerized deployment

## Quick Start (Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or use Docker)

### 1. Clone and install

```bash
git clone https://github.com/JD-06/UatExam.git
cd UatExam

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials and JWT secrets
```

Example `.env`:
```env
DATABASE_URL=postgresql://uatforms:password@localhost:5432/uatforms
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-this-in-production
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Setup database

```bash
cd backend

# Push schema to database (development)
npm run db:push

# Or run migrations
npm run db:migrate
```

### 4. Start development servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001

## Docker Deployment

### 1. Configure environment

```bash
cp backend/.env.example .env
# Set DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET
```

Create `.env` in project root:
```env
DB_PASSWORD=your-secure-db-password
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-at-least-32-chars
FRONTEND_URL=http://your-domain.com
```

### 2. Build and run

```bash
docker-compose up --build -d
```

App will be available at http://localhost (port 80).

### 3. View logs

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/refresh | Refresh access token |

### Forms
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/forms | All (filtered by role) |
| POST | /api/forms | Profesor only |
| GET | /api/forms/:id | All |
| PUT | /api/forms/:id | Owner only |
| DELETE | /api/forms/:id | Owner only |
| GET | /api/forms/:id/results | Owner only |
| POST | /api/forms/:id/assign | Owner only |

### Groups
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/groups | All (filtered by role) |
| POST | /api/groups | Profesor only |
| GET | /api/groups/:id | All |
| POST | /api/groups/join | Alumno |
| DELETE | /api/groups/:id/members/:userId | Owner only |

### Responses
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/responses | Alumno |
| GET | /api/responses/:formId | Profesor (owner) |

## Project Structure

```
UatExam/
├── backend/
│   └── src/
│       ├── index.ts              # Express app + Socket.io
│       ├── prisma/
│       │   └── schema.prisma     # Database schema
│       ├── routes/               # API routes
│       ├── controllers/          # Business logic
│       ├── middleware/           # Auth + validation
│       └── lib/
│           └── prisma.ts         # Prisma client
├── frontend/
│   └── src/
│       ├── App.tsx               # Router setup
│       ├── pages/                # Page components
│       ├── components/           # Shared components
│       │   └── ui/               # shadcn-compatible UI
│       ├── store/                # Zustand state
│       ├── api/                  # Axios client
│       └── types/                # TypeScript types
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── nginx.conf
```

## Brand Colors

| Color | Hex |
|-------|-----|
| Azul institucional | `#003087` |
| Dorado/Amarillo | `#F2A900` |
| Blanco | `#FFFFFF` |
| Gris fondo | `#F5F7FA` |

## Email Domains

- `@uat.edu.mx` → **Profesor** role
- `@alumnos.uat.edu.mx` → **Alumno** role
- All other domains are rejected

## License

Universidad Autónoma de Tamaulipas — All rights reserved.
