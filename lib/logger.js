const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.info;

function formatTimestamp() {
  return new Date().toISOString();
}

function log(level, namespace, message, data) {
  if (LOG_LEVELS[level] < CURRENT_LEVEL) return;
  const entry = { t: formatTimestamp(), level, ns: namespace, msg: message };
  if (data) entry.data = data;
  const output = JSON.stringify(entry);
  if (level === 'error') console.error(output);
  else if (level === 'warn') console.warn(output);
  else console.log(output);
}

module.exports = {
  debug: (ns, msg, data) => log('debug', ns, msg, data),
  info: (ns, msg, data) => log('info', ns, msg, data),
  warn: (ns, msg, data) => log('warn', ns, msg, data),
  error: (ns, msg, data) => log('error', ns, msg, data),
};
