/* ============================================================
   SANITIZE — Shared input sanitization helpers
   Extracted from server.js for modular architecture.
   ============================================================ */

function sanitizeText(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength);
}

function sanitizeLink(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

module.exports = { sanitizeText, sanitizeLink };
