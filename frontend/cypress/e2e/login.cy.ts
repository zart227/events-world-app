describe('Вход в систему', () => {
  beforeEach(() => {
    cy.setupApiMocks();
  });

  it('выполняет вход и открывает страницу местоположения', () => {
    cy.loginViaUi();
    cy.assertLocationPage();
    cy.get('.ant-menu').contains(Cypress.env('test_email')).should('be.visible');
  });

  it('сохраняет пользователя в localStorage', () => {
    cy.loginViaUi();
    cy.window().then((win) => {
      const user = JSON.parse(win.localStorage.getItem('user') || '{}');
      expect(user.email).to.eq(Cypress.env('test_email'));
      expect(win.localStorage.getItem('accessToken')).to.exist;
    });
  });
});
