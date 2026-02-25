const E2E_PREFIX = '[E2E Test]';
const testProductName = `${E2E_PREFIX} Producto ${Date.now()}`;

describe('CRUD Productos', () => {
  beforeEach(() => {
    cy.loginAs('admin');
  });

  it('navega a la página de crear producto', () => {
    cy.visit('/productos');
    cy.contains(/nuevo producto|nuevo|crear/i, { timeout: 10000 }).first().click();
    cy.url({ timeout: 10000 }).should('include', '/productos/crear');
  });

  it('muestra el formulario de creación de producto', () => {
    cy.visit('/productos/crear');
    cy.get('input[name="name"], input[id="name"]', { timeout: 10000 }).should('be.visible');
  });

  it('crea un nuevo producto', () => {
    cy.visit('/productos/crear');

    cy.get('input[name="name"], input[id="name"]', { timeout: 10000 })
      .first()
      .clear()
      .type(testProductName);

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
    cy.contains(/exitosamente|creado|guardado/i, { timeout: 15000 }).should('be.visible');
  });

  it('muestra el detalle de un producto existente', () => {
    cy.visit('/productos');
    cy.get('table tbody tr', { timeout: 10000 }).first().click();
    cy.url().should('match', /\/productos\/\d+/);
    cy.get('h1, h2', { timeout: 5000 }).should('be.visible');
  });

  it('navega a editar un producto existente', () => {
    cy.visit('/productos');
    cy.get('table tbody tr', { timeout: 10000 }).first().click();
    cy.url().should('match', /\/productos\/\d+/);
    cy.contains(/editar/i, { timeout: 5000 }).first().click();
    cy.url().should('match', /\/productos\/\d+\/editar/);
  });
});
