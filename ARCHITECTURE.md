# Architecture - PackOptima

## Key Architectural Decisions

1. **Next.js App Router (Single Codebase)**
   - Utilizes Next.js App Router for frontend UI and Route Handlers for the backend API pipeline. This simplifies deployment and aligns with serverless architectures.

2. **MongoDB Connection Caching**
   - Implemented connection caching in `src/lib/db.ts` to prevent Mongoose connection pooling issues in serverless database routes during hot reloads and concurrent requests.

3. **No-Claim AI Processing Abstraction**
   - The system is built around deterministic computer vision resizing, centering, padding, and brightness adjustments combined with third-party background removal services.
   - All AI service provider endpoints will be designed through an abstraction layer to permit seamless swap-outs.

4. **Robust Logging and Centralized Error Handling**
   - Pino is utilized to output clean logs.
   - The centralized error handler `handleApiError` wraps API routes, normalizing validation (Zod) and application errors (`AppError`) into structured JSON responses.
