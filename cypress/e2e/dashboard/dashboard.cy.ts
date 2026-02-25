describe('Dashboard', () => {
  beforeEach(() => {
    cy.loginAs('admin');
    cy.visit('/dashboard');
  });

  it('carga correctamente', () => {
    cy.url().should('include', '/dashboard');
    cy.get('h1, h2').should('be.visible');
  });

  it('muestra el sidebar de navegación con los enlaces principales', () => {
    cy.get('[data-cy="nav-dashboard"]').should('exist');
    cy.get('[data-cy="nav-maquinas"]').should('exist');
    cy.get('[data-cy="nav-productos"]').should('exist');
    cy.get('[data-cy="nav-pagos"]').should('exist');
  });

  it('muestra acciones rápidas para admin', () => {
    cy.contains(/acciones rápidas/i, { timeout: 10000 }).should('be.visible');
  });

  it('navega a máquinas desde el sidebar', () => {
    cy.get('[data-cy="nav-maquinas"]').click();
    cy.url().should('include', '/maquinas');
  });

  it('navega a productos desde el sidebar', () => {
    cy.get('[data-cy="nav-productos"]').click();
    cy.url().should('include', '/productos');
  });

  it('navega a pagos desde el sidebar', () => {
    cy.get('[data-cy="nav-pagos"]').click();
    cy.url().should('include', '/pagos');
  });
});
