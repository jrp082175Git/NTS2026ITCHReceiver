export function safeStringify(obj) {
  try {
    return JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  } catch (err) {
    return `{"error": "Failed to stringify JSON", "details": "${err.message}"}`;
  }
}
