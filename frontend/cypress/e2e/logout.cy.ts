describe('Выход из системы', () => {
  beforeEach(() => {
    cy.setupApiMocks();
    cy.login();
  });

  it('очищает localStorage и перенаправляет на /login', () => {
    cy.visit('/location');
    cy.get('[data-role="logout"]').click();
    cy.wait('@authLogout');
    cy.url().should('include', '/login');

    cy.window().then((win) => {
      expect(win.localStorage.getItem('user')).to.be.null;
      expect(win.localStorage.getItem('accessToken')).to.be.null;
    });

    cy.get('[data-role="logout"]').should('not.exist');
    cy.get('.ant-menu').contains('Вход').should('be.visible');
  });
});
