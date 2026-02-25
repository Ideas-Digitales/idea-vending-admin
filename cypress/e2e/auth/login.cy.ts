describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('muestra el formulario de login', () => {
    cy.get('[data-cy="email-input"]').should('be.visible');
    cy.get('[data-cy="password-input"]').should('be.visible');
    cy.get('[data-cy="login-submit"]').should('be.visible');
  });

  it('botón submit está deshabilitado sin credenciales', () => {
    cy.get('[data-cy="login-submit"]').should('be.disabled');
  });

  it('botón submit se habilita al ingresar credenciales', () => {
    cy.get('[data-cy="email-input"]').type('test@example.com');
    cy.get('[data-cy="password-input"]').type('password123');
    cy.get('[data-cy="login-submit"]').should('not.be.disabled');
  });

  it('muestra error con credenciales incorrectas', () => {
    cy.get('[data-cy="email-input"]').type('invalido@test.com');
    cy.get('[data-cy="password-input"]').type('passwordincorrecta');
    cy.get('[data-cy="login-submit"]').click();
    cy.get('[data-cy="login-error"]', { timeout: 10000 }).should('be.visible');
  });

  it('redirige al dashboard con credenciales válidas', () => {
    cy.get('[data-cy="email-input"]').type(Cypress.env('ADMIN_EMAIL'));
    cy.get('[data-cy="password-input"]').type(Cypress.env('ADMIN_PASSWORD'), { log: false });
    cy.get('[data-cy="login-submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/dashboard');
  });
});
