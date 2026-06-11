describe('Страница «О нас»', () => {
  it('открывается без авторизации и показывает контент', () => {
    cy.visit('/about');
    cy.contains('h1', 'О нашем проекте').should('be.visible');
    cy.contains('PM2.5').should('be.visible');
    cy.contains('PM10').should('be.visible');
    cy.get('img[alt="Загрязнение окружающей среды"]').should('be.visible');
  });

  it('доступна из шапки', () => {
    cy.visit('/about');
    cy.get('.ant-menu').contains('О нас').should('be.visible');
  });
});
