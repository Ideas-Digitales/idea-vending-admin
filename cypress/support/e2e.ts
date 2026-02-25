import './commands';

// Next.js lanza errores de navegación abortada — no fallar el test por eso
Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('NEXT_REDIRECT') ||
    err.message.includes('AbortError') ||
    err.message.includes('Navigation cancelled')
  ) return false;
});
