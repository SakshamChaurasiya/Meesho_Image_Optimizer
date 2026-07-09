# Changelog - PackOptima

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-07-09

### Added
- Cloudinary SDK Node integration (`src/lib/cloudinary.ts`) for secure image hosting.
- Server-side image validator and route handler `/api/upload` (`src/app/api/upload/route.ts`) supporting metadata persistence in MongoDB.
- Reusable drag-and-drop React component `<ImageUploader />` (`src/components/image-uploader.tsx`) with client-side type/size filters and sonner toasts.
- Interactive uploaded images dashboard grid on the Home landing page.

## [0.1.0] - 2026-07-09

### Added
- Next.js 14 baseline configuration with Tailwind CSS and TypeScript.
- shadcn/ui framework integration.
- Database client caching configuration (`src/lib/db.ts`) and ProductImage model schemas.
- Pino logger and error handler helpers.
