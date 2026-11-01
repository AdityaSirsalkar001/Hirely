# Hirely

### Vendor and Hiring Manager Contract Management Platform

Hirely is a recruitment management platform designed to connect hiring managers and vendors through a centralized workspace. It simplifies recruitment workflows with opening management, candidate evaluation, and AI-assisted recommendations.

## Features

- **Hiring Management:** Create and manage recruitment openings.
- **Vendor Workspace:** Explore opportunities and manage recruitment submissions.
- **Candidate Evaluation:** Review candidate profiles and application details.
- **AI Recommendations:** AI-assisted candidate analysis and recommendations.
- **User Management:** Manage profiles and account settings.
- **Authentication:** Secure authentication with TOTP verification.
- **Support:** Dedicated support interface.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| State Management | Redux Toolkit |
| UI Components | Radix UI, Lucide React |
| Animations | Framer Motion |
| Data Visualization | Recharts |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | Keycloak, TOTP |
| AI Integration | Groq API |
| Cloud Storage | AWS S3 |
| Infrastructure | Docker, Docker Compose |

## Project Structure

    Hirely/
    ├── Zelosify-Frontend/
    │   ├── public/
    │   └── src/
    │       ├── app/
    │       ├── components/
    │       ├── hooks/
    │       ├── redux/
    │       ├── styles/
    │       └── utils/
    │
    ├── Zelosify-Backend/
    │   └── Server/
    │       ├── prisma/
    │       └── src/
    │
    └── README.md
    ## Prerequisites

- Node.js 22 or later
- npm
- Docker
- Docker Compose

## Getting Started

### 1. Clone the Repository

    git clone https://github.com/AdityaSirsalkar001/Hirely.git
    cd Hirely

### 2. Backend Setup

Configure the required environment variables in `Zelosify-Backend/Server/.env`.

    cd Zelosify-Backend/Server
    npm install
    npm run prisma:generate
    npx prisma migrate deploy
    npm run dev

### 3. Frontend Setup

Configure the frontend environment variables in `Zelosify-Frontend/.env`.

Set the backend API URL:

    NEXT_PUBLIC_BACKEND_URL=http://localhost:5000/api/v1

Install dependencies and start the frontend:

    cd Zelosify-Frontend
    npm install
    npm run dev

## Application Routes

| Section | Route |
|---|---|
| Hiring Manager openings | `/hiring-manager/openings` |
| Hiring Manager opening details | `/hiring-manager/openings/:id` |
| Vendor Opportunities | `/vendor/openings` |
| User Settings | `/user/settings` |
| Support | `/user/support` |

## Database

Hirely uses PostgreSQL with Prisma ORM for database management.

To access Prisma Studio, run this command from the backend directory:

    npx prisma studio

## License

All rights reserved.
