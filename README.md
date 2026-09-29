# CSM - Car Showroom Management System

Modern, high-performance monorepo for car showroom and sales management, built with Next.js 15, NestJS 10, Prisma ORM, and PostgreSQL.

## Architecture

- **`packages/contracts`**: Shared TypeScript types & Zod schemas (`@csm/contracts`).
- **`backend`**: NestJS API with Prisma ORM (`csm-api`), running on port `4000`.
- **`frontend`**: Next.js 15 (App Router, Tailwind CSS v4, shadcn/ui) (`csm-web`), running on port `3000`.

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Build shared contracts
npm run build:contracts

# 3. Setup database & start dev servers
npm run dev:backend
npm run dev:frontend
```

## Production Deployment

```bash
chmod +x deploy.sh
./deploy.sh
```
