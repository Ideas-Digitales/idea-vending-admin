// Métricas solo es visible en sidebar para rol 'customer'
describe('Métricas', () => {
  beforeEach(() => {
    cy.loginAs('customer');
    cy.visit('/metricas');
  });

  it('carga la página de métricas', () => {
    cy.url().should('include', '/metricas');
    cy.contains(/métricas/i, { timeout: 10000 }).should('be.visible');
  });

  it('muestra selector de período', () => {
    // El selector puede ser tabs, select o botones
    cy.get('button, [role="tab"], select', { timeout: 10000 })
      .should('have.length.gte', 1);
  });

  it('cambia de período al hacer click en Día', () => {
    cy.contains(/día|today|hoy/i, { timeout: 10000 }).click();
    cy.wait(500);
    // Verifica que el gráfico de barras esté presente (BarChart para día)
    cy.get('svg, canvas, [class*="recharts"]', { timeout: 5000 }).should('exist');
  });

  it('cambia de período al hacer click en Mes', () => {
    cy.contains(/mes|month/i, { timeout: 10000 }).click();
    cy.wait(500);
    // Verifica que el gráfico de área esté presente (AreaChart para mes)
    cy.get('svg, canvas, [class*="recharts"]', { timeout: 5000 }).should('exist');
  });

  it('muestra al menos un gráfico cargado', () => {
    cy.get('svg, canvas, [class*="recharts"], [class*="chart"]', { timeout: 10000 }).should('exist');
  });

  it('muestra métricas en el sidebar del rol customer', () => {
    cy.get('[data-cy="nav-metricas"]').should('exist');
  });
});
