/**
 * Backend Keep-Alive Self-Ping
 * 
 * Automatically sends an HTTP GET request to this service's public Render URL
 * every 10 minutes to reset Render's 15-minute idle spin-down timer.
 */

const DEFAULT_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const TIMEOUT_MS = 10 * 1000; // 10 seconds

let timer = null;

function getBaseUrl() {
  const url = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL || '';
  return url.trim().replace(/\/+$/, '');
}

function isEnabled() {
  return process.env.KEEP_ALIVE_ENABLED !== 'false';
}

function getIntervalMs() {
  const parsed = Number(process.env.KEEP_ALIVE_INTERVAL_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_INTERVAL_MS;
}

/**
 * Executes a single ping to the /healthz endpoint
 */
async function ping() {
  const baseUrl = getBaseUrl();
  if (!baseUrl) return;

  const targetUrl = `${baseUrl}/healthz`;
  const started = Date.now();

  try {
    const res = await fetch(targetUrl, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': 'printit-keep-alive/1.0',
        'Cache-Control': 'no-cache'
      }
    });
    const latency = Date.now() - started;
    console.log(`[keep-alive] ${res.status} OK in ${latency}ms -> ${targetUrl}`);
  } catch (err) {
    const latency = Date.now() - started;
    console.warn(`[keep-alive] failed after ${latency}ms: ${err.message}`);
  }
}

/**
 * Starts the keep-alive scheduler
 */
function startKeepAlive() {
  if (!isEnabled()) {
    console.log('[keep-alive] disabled via KEEP_ALIVE_ENABLED=false');
    return;
  }

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    console.log('[keep-alive] No public URL set (KEEP_ALIVE_URL or RENDER_EXTERNAL_URL); skipping scheduler.');
    return;
  }

  if (timer) {
    // Guard against duplicate intervals (e.g. during reload)
    return;
  }

  const intervalMs = getIntervalMs();
  console.log(`[keep-alive] started, pinging every ${intervalMs / 1000}s -> ${baseUrl}/healthz`);

  timer = setInterval(ping, intervalMs);

  // Allow process to terminate cleanly without timer hanging event loop if needed
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
}

/**
 * Stops the keep-alive scheduler
 */
function stopKeepAlive() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('[keep-alive] stopped');
  }
}

module.exports = {
  startKeepAlive,
  stopKeepAlive,
  ping,
  getBaseUrl,
  isEnabled,
  getIntervalMs
};
