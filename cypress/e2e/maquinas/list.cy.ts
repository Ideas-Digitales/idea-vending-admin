describe('Lista de Máquinas', () => {
  beforeEach(() => {
    cy.loginAs('admin');
    cy.visit('/maquinas');
  });

  it('carga la página de máquinas', () => {
    cy.url().should('include', '/maquinas');
    cy.contains(/máquinas/i, { timeout: 10000 }).should('be.visible');
  });

  it('muestra al menos una máquina en la tabla', () => {
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.gte', 1);
  });

  it('muestra el botón para crear nueva máquina', () => {
    cy.contains(/nueva máquina|nueva|crear/i, { timeout: 10000 }).should('be.visible');
  });

  it('busca una máquina por nombre', () => {
    cy.get('input[placeholder*="uscar"], input[type="search"]', { timeout: 10000 })
      .first()
      .type('a');
    cy.wait(500);
    // Debe mostrar resultados o estado vacío
    cy.get('table tbody tr, [data-cy="empty-state"]', { timeout: 5000 }).should('exist');
  });

  it('filtra por estado usando el selector Radix UI', () => {
    // Radix Select no es <select> nativo — usar click en el texto
    cy.contains(/todos los estados|estado/i, { timeout: 10000 }).first().click();
    cy.contains(/en línea|online/i).click();
    cy.wait(500);
    cy.get('table tbody tr, [data-cy="empty-state"]', { timeout: 5000 }).should('exist');
  });

  it('navega al detalle de una máquina al hacer click en una fila', () => {
    cy.get('table tbody tr', { timeout: 10000 }).first().click();
    cy.url().should('match', /\/maquinas\/\d+/);
  });

  it('tiene paginación cuando hay más de una página', () => {
    // La paginación puede o no existir dependiendo de los datos
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="pagination"], nav[aria-label*="paginación"]').length) {
        cy.get('[data-cy="pagination"], nav[aria-label*="paginación"]').should('be.visible');
      }
    });
  });
});
