import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

// Create a thread-safe, serverless-friendly Pino instance
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  // Avoid using pino-pretty transport in Next.js backend as it spawns worker threads
  // that clash with Next.js development bundler and serverless environments.
});

export default logger;
