describe('Protección de rutas', () => {
  it('redirige al login si no está autenticado al acceder a /dashboard', () => {
    cy.visit('/dashboard');
    cy.url({ timeout: 10000 }).should('include', '/login');
  });

  it('redirige al login si no está autenticado al acceder a /maquinas', () => {
    cy.visit('/maquinas');
    cy.url({ timeout: 10000 }).should('include', '/login');
  });

  it('redirige al login si no está autenticado al acceder a /productos', () => {
    cy.visit('/productos');
    cy.url({ timeout: 10000 }).should('include', '/login');
  });

  it('permite acceso al dashboard cuando está autenticado', () => {
    cy.loginAs('admin');
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
  });

  it('cierra sesión correctamente', () => {
    cy.loginAs('admin');
    cy.visit('/dashboard');
    cy.logout();
    cy.url().should('include', '/login');
  });

  it('no puede acceder a rutas protegidas tras cerrar sesión', () => {
    cy.loginAs('admin');
    cy.visit('/dashboard');
    cy.logout();
    cy.visit('/dashboard');
    cy.url({ timeout: 10000 }).should('include', '/login');
  });
});
