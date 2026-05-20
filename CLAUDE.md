# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- Start development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm run start`
- Lint code: `npm run lint`
- Seed database: `npm run seed`
- Seed technician demo data: `npm run seed:technician`

## Code Architecture

### High-Level Structure
- **Next.js App Router**: Uses Next.js 16.2.4 with the `app` directory for routing.
- **Authentication**: NextAuth v4 (`src/app/api/auth/[...nextauth]/route.ts`).
- **Database**: Prisma ORM with PostgreSQL adapter (`src/lib/prisma.ts`). Schema in `prisma/` directory.
- **Real-time**: Supabase client (`src/lib/supabase/client.ts`) and server (`src/lib/supabase/server.ts`) for subscriptions.
- **Styling**: Tailwind CSS v4 configured via `tailwind.config.ts` and `postcss.config.mjs`.
- **Types**: Shared TypeScript definitions in `src/types/index.ts`.

### Route Organization
- **Public routes**: `src/app/(auth)/` (login, register).
- **User (Student) routes**: `src/app/(user)/` (dashboard, requests, profile, notifications).
- **Technician routes**: `src/app/technician/` (dashboard, history, notifications, profile, settings).
- **Admin routes**: `src/app/admin/` (dashboard, users, requests, assignments, audit logs, analytics, settings).
- **API routes**: `src/app/api/` (auth, requests, tasks, notifications, admin endpoints).

### Key Directories
- `src/components`: Reusable UI components split by role (`admin`, `technician`, `user`, `shared`, `ui`).
- `src/lib`: Utility services (Prisma, Supabase clients).
- `src/hooks`: Custom React hooks (currently empty).
- `src/utils`: Utility functions (currently empty).
- `prisma`: Prisma schema and seed scripts.

### Important Files
- `src/app/layout.tsx`: Root layout with fonts and metadata.
- `src/app/globals.css`: Global CSS including Tailwind directives.
- `next.config.ts`: Next.js configuration.
- `.env`: Environment variables (database, NextAuth, Supabase).

## Common Tasks
- To create a new page: Add a `.tsx` file in the appropriate `src/app/[route]/` directory.
- To add a component: Place in `src/components/[role]/` or `src/components/shared/` if cross-role.
- To modify database: Update `prisma/schema.prisma` then run `prisma migrate dev` and `npm run seed`.
- To add API route: Create a `route.ts` file in `src/app/api/[resource]/`.
- To use Supabase: Import from `src/lib/supabase/client.ts` (client) or `src/lib/supabase/server.ts` (server).

## Notes
- This project uses TypeScript strictly; ensure type safety when adding features.
- Authentication middleware is handled by NextAuth; protect routes via `next-auth/middleware` or checking session in server components.
- Tailwind v4 uses a different syntax; refer to `tailwind.config.ts` for customizations.
- The seed scripts (`prisma/seed.ts` and `prisma/seed-technician-demo.ts`) populate initial data for development.