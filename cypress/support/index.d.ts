declare namespace Cypress {
  interface Chainable {
    login(email: string, password: string): Chainable<void>;
    loginAs(role: 'admin' | 'customer' | 'technician'): Chainable<void>;
    logout(): Chainable<void>;
  }
}
