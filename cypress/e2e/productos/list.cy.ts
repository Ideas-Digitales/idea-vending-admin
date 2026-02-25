describe('Lista de Productos', () => {
  beforeEach(() => {
    cy.loginAs('admin');
    cy.visit('/productos');
  });

  it('carga la página de productos', () => {
    cy.url().should('include', '/productos');
    cy.contains(/productos/i, { timeout: 10000 }).should('be.visible');
  });

  it('muestra al menos un producto en la tabla', () => {
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.gte', 1);
  });

  it('muestra el botón para crear nuevo producto', () => {
    cy.contains(/nuevo producto|nuevo|crear/i, { timeout: 10000 }).should('be.visible');
  });

  it('busca un producto por nombre', () => {
    cy.get('input[placeholder*="uscar"], input[type="search"]', { timeout: 10000 })
      .first()
      .type('a');
    cy.wait(500);
    cy.get('table tbody tr, [data-cy="empty-state"]', { timeout: 5000 }).should('exist');
  });

  it('navega al detalle de un producto al hacer click en una fila', () => {
    cy.get('table tbody tr', { timeout: 10000 }).first().click();
    cy.url().should('match', /\/productos\/\d+/);
  });
});
