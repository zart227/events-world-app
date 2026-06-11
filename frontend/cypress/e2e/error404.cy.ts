describe('Страница 404', () => {
  it('показывает сообщение для несуществующего маршрута', () => {
    cy.visit('/unknown-route', { failOnStatusCode: false });
    cy.contains('h1', '404 - Page Not Found').should('be.visible');
    cy.contains('The page you are looking for does not exist.').should('be.visible');
  });
});
