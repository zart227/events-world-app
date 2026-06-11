describe('Защищённые маршруты', () => {
  beforeEach(() => {
    cy.setupApiMocks();
  });

  const privatePaths = ['/location', '/city-info'];

  privatePaths.forEach((path) => {
    it(`перенаправляет гостя с ${path} на /login`, () => {
      cy.visit(path);
      cy.url().should('include', '/login');
    });
  });

  it('после входа открывает /location', () => {
    cy.login();
    cy.visit('/location');
    cy.url().should('include', '/location');
    cy.assertLocationPage();
  });
});
