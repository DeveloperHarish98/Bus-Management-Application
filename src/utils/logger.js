// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
  table: console.table,
  dir: console.dir,
  trace: console.trace
};


const log = {
  info: (...args) => {},
  warn: (...args) => {},
  error: (...args) => originalConsole.error(...args), // Only show errors
  debug: (...args) => {},
  log: (...args) => {}
};

// Restore original console methods
Object.keys(originalConsole).forEach(method => {
  if (console[method]) {
    console[method] = originalConsole[method];
  }
});

// Export the logger
export { log };
export default log;
