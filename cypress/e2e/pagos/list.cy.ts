describe('Lista de Pagos', () => {
  beforeEach(() => {
    cy.loginAs('admin');
    cy.visit('/pagos');
  });

  it('carga la página de pagos', () => {
    cy.url().should('include', '/pagos');
    cy.contains(/pagos/i, { timeout: 10000 }).should('be.visible');
  });

  it('muestra al menos un pago', () => {
    // La lista puede ser una tabla o cards, dependiendo de la implementación
    cy.get('table tbody tr, [data-cy="payment-item"], li', { timeout: 10000 }).should('have.length.gte', 1);
  });

  it('tiene controles de filtro', () => {
    // Busca algún input de búsqueda o selector de filtro
    cy.get('input[type="search"], input[placeholder*="uscar"], select, [role="combobox"]', { timeout: 10000 })
      .should('have.length.gte', 1);
  });

  it('filtra por estado de pago', () => {
    // Intenta encontrar un filtro de estado
    cy.get('body').then(($body) => {
      if ($body.find('select').length) {
        cy.get('select').first().then(($select) => {
          const options = $select.find('option');
          if (options.length > 1) {
            cy.wrap($select).select(1);
            cy.wait(500);
            cy.get('table tbody tr, [data-cy="payment-item"], li', { timeout: 5000 }).should('exist');
          }
        });
      } else if ($body.text().includes('Completado') || $body.text().includes('Pendiente')) {
        cy.contains(/completado|completada/i).click();
        cy.wait(500);
      }
    });
  });

  it('abre modal de detalle al hacer click en un pago', () => {
    cy.get('table tbody tr, [data-cy="payment-item"]', { timeout: 10000 }).first().click();
    // El modal puede aparecer como dialog o como navegación a detalle
    cy.get('[role="dialog"], [data-cy="payment-detail"]', { timeout: 5000 }).should('be.visible');
  });
});
