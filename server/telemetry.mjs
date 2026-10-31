import * as Sentry from '@sentry/node';

let currentDsn = '';
export function configureTelemetry(dsn) {
  if (!dsn || dsn === currentDsn) return;
  Sentry.init({ dsn, tracesSampleRate: 1, environment: process.env.NODE_ENV || 'development', sendDefaultPii: false });
  currentDsn = dsn;
}
export async function trace(config, operation, name, attributes, callback) {
  if (!config.sentryDsn) return callback(null);
  configureTelemetry(config.sentryDsn);
  return Sentry.startSpan({ op: operation, name, attributes }, callback);
}
export function captureFailure(error, run) {
  if (!currentDsn) return;
  Sentry.captureException(error, { tags: { run_id: run.id, mode: run.mode }, extra: { model: run.model } });
}
