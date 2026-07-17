import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://dummy-sentry-dsn@o0.ingest.sentry.io/0",
  tracesSampleRate: 1.0,
  debug: false,
});
