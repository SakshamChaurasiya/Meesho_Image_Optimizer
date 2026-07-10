# Changelog - PackOptima

All notable changes to this project will be documented in this file.

## [0.4.0] - 2026-07-10

### Added
- `@imgly/background-removal-node` as a local fallback provider for background removal tasks.
- Fallback provider chain architecture with configurable environment settings (`BACKGROUND_PROVIDER`, `BACKGROUND_FALLBACK`).
- Metadata persistence (`backgroundProvider` and `fallbackUsed` fields) in MongoDB.
- Caching and buffer reuse for background removed results to eliminate redundant calls and keep memory usage low.

## [0.3.0] - 2026-07-09

### Added
- Modular, deterministic image optimization engine (`src/lib/processor.ts`) supporting 24-variant generation.
- Bounding area, occupancy ratio, white space ratio, alignment center, brightness, contrast, resolution, and aspect ratio image analysis.
- Graceful API error handling fallback during background removal tasks.
- Image validation rules pipeline discarding low-resolution or border-touching variants.
- Visual ranking engine utilizing internal quality optimization score.
- Responsive variant grid gallery displaying rank and quality score badges.
- Eye-catching image characteristics analysis dashboard grid on the results page.

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
