describe('Главная страница', () => {
  beforeEach(() => {
    cy.setupApiMocks();
  });

  it('перенаправляет неавторизованного пользователя на /login', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
  });

  it('перенаправляет авторизованного пользователя на /location', () => {
    cy.login();
    cy.visit('/');
    cy.url().should('include', '/location');
  });
});
