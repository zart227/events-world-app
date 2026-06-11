describe('Страница «Информация о городе»', () => {
  beforeEach(() => {
    cy.setupApiMocks();
    cy.login();
  });

  it('загружает историю загрязнений и отображает таблицу', () => {
    cy.visit('/city-info');
    cy.wait('@getPollutions');
    cy.contains('h1', 'Информация о городе').should('be.visible');
    cy.get('.ant-table').contains('Казань').should('be.visible');
    cy.get('.ant-table').contains('Умеренно').should('be.visible');
  });

  it('получает данные по новому городу', () => {
    cy.visit('/city-info');
    cy.wait('@getPollutions');

    cy.get('input[placeholder="Введите название города или адрес"]').type('Москва');
    cy.contains('button', 'Получить').should('not.be.disabled').click();
    cy.wait('@getCurrentPollution');

    cy.get('.ant-table').contains('Москва').should('be.visible');
  });

  it('оформляет подписку на город', () => {
    cy.visit('/city-info');
    cy.wait('@getPollutions');

    cy.get('input[placeholder="Введите название города или адрес"]').type('Москва');
    cy.contains('button', 'Подписаться на город').should('not.be.disabled').click();
    cy.wait('@createSubscription');

    cy.contains('Мои подписки').should('be.visible');
    cy.contains('.ant-tag', 'Москва').should('be.visible');
  });

  it('удаляет подписку на город', () => {
    cy.visit('/city-info');
    cy.wait('@getSubscriptions');
    cy.contains('Мои подписки').should('be.visible');
    cy.contains('button', 'Отписаться').click();
    cy.wait('@deleteSubscription');
    cy.contains('Мои подписки').should('not.exist');
  });
});
