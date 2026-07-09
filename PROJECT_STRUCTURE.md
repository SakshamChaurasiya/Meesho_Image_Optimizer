# Project Structure - PackOptima

Here is the directory structure of the application:

```text
MeeshoOptimizer/
├── src/
│   ├── app/
│   │   ├── api/             # Next.js API Route Handlers
│   │   ├── globals.css      # Global CSS and Tailwind directives
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Premium Hero landing page
│   ├── components/
│   │   ├── ui/              # shadcn/ui components (card, input, switch, etc.)
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── lib/
│   │   ├── db.ts            # Mongoose connection pooling helper
│   │   ├── error-handler.ts # Centralized route handler error wrapper
│   │   ├── logger.ts        # Pino logger instance
│   │   └── utils.ts         # Utility helpers (cn class merger)
│   └── models/
│       └── ProductImage.ts  # Mongoose model for product images
├── components.json          # shadcn/ui setup configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # NPM package scripts and dependencies
```
