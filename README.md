# PackOptima - AI Product Image Optimizer

PackOptima is a production-ready SaaS application designed to help e-commerce marketplace sellers optimize their product images to reduce logistics scanning errors and maximize the chances of receiving lower shipping charges on platforms like Meesho.

The application intelligently applies computer vision techniques (e.g., padding, centering, contrast adjustments) and generates multiple variations of images without claiming to predict proprietary marketplace algorithms.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Next.js Route Handlers, @imgly/background-removal-node (local fallback background removal)
- **Database**: MongoDB (Mongoose ODM)
- **Logging**: Pino
- **Validation**: Zod

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the environment variables:
   ```bash
   cp .env.example .env
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.
