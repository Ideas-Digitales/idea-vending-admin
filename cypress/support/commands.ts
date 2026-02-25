Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session(
    `user-${email}`,
    () => {
      cy.visit('/login');
      // Esperar hidratación de <ClientOnly>
      cy.get('[data-cy="email-input"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-cy="email-input"]').clear().type(email);
      cy.get('[data-cy="password-input"]').clear().type(password, { log: false });
      cy.get('[data-cy="login-submit"]').click();
      // setTimeout de 1500ms en el login antes de router.replace('/dashboard')
      cy.url({ timeout: 15000 }).should('include', '/dashboard');
    },
    {
      cacheAcrossSpecs: true,
      // Solo verificar la cookie — cy.window() en validate apunta a página en
      // blanco (sin URL de la app), así que localStorage no es accesible aquí.
      validate: () => {
        cy.getCookie('auth-token').should('exist');
      },
    }
  );
});

Cypress.Commands.add('loginAs', (role: 'admin' | 'customer' | 'technician') => {
  const map = {
    admin:      { e: 'ADMIN_EMAIL',    p: 'ADMIN_PASSWORD'    },
    customer:   { e: 'CUSTOMER_EMAIL', p: 'CUSTOMER_PASSWORD' },
    technician: { e: 'ADMIN_EMAIL',    p: 'ADMIN_PASSWORD'    },
  } as const;
  const { e, p } = map[role];
  cy.login(Cypress.env(e), Cypress.env(p));
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="sidebar-logout"]', { timeout: 10000 }).should('be.visible').click();
  cy.url({ timeout: 10000 }).should('include', '/login');
});
