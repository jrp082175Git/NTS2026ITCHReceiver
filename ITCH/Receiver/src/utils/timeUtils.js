export function getCurrentTimestampMs() {
  return Date.now();
}

export function formatTimestamp(ms) {
  return new Date(ms).toISOString();
}
