const E2E_PREFIX = '[E2E Test]';
const testMachineName = `${E2E_PREFIX} Máquina ${Date.now()}`;

describe('CRUD Máquinas', () => {
  beforeEach(() => {
    cy.loginAs('admin');
  });

  it('navega a la página de crear máquina', () => {
    cy.visit('/maquinas');
    cy.contains(/nueva máquina|nueva|crear/i, { timeout: 10000 }).first().click();
    cy.url({ timeout: 10000 }).should('include', '/maquinas/nueva');
  });

  it('muestra el formulario de creación de máquina', () => {
    cy.visit('/maquinas/nueva');
    cy.get('input[name="name"], input[id="name"]', { timeout: 10000 }).should('be.visible');
    cy.get('input[name="location"], input[id="location"]', { timeout: 10000 }).should('be.visible');
  });

  it('crea una nueva máquina', () => {
    cy.visit('/maquinas/nueva');

    cy.get('input[name="name"], input[id="name"]', { timeout: 10000 })
      .first()
      .clear()
      .type(testMachineName);

    cy.get('input[name="location"], input[id="location"]')
      .first()
      .clear()
      .type('[E2E] Ubicación de prueba');

    // Seleccionar empresa (primer option disponible)
    cy.get('select[name="enterprise_id"], select[id="enterprise_id"]', { timeout: 5000 })
      .then(($select) => {
        if ($select.length) {
          cy.wrap($select).find('option').not('[value="0"]').first().then(($option) => {
            cy.wrap($select).select($option.val() as string);
          });
        }
      });

    cy.get('button[type="submit"]').first().click();
    cy.contains(/exitosamente|creada|guardada/i, { timeout: 15000 }).should('be.visible');
  });

  it('muestra el detalle de una máquina existente', () => {
    cy.visit('/maquinas');
    cy.get('table tbody tr', { timeout: 10000 }).first().click();
    cy.url().should('match', /\/maquinas\/\d+/);
    cy.get('h1, h2', { timeout: 5000 }).should('be.visible');
  });

  it('navega a editar una máquina existente', () => {
    cy.visit('/maquinas');
    cy.get('table tbody tr', { timeout: 10000 }).first().click();
    cy.url().should('match', /\/maquinas\/\d+/);
    cy.contains(/editar/i, { timeout: 5000 }).first().click();
    cy.url().should('match', /\/maquinas\/\d+\/editar/);
  });
});
