describe('Страница «Местоположение»', () => {
  beforeEach(() => {
    cy.setupApiMocks();
    cy.login();
  });

  it('отображает форму поиска и таблицу', () => {
    cy.visit('/location');
    cy.get('input[placeholder="Введите местоположение"]').should('be.visible');
    cy.contains('button', 'Искать').should('be.visible');
    cy.get('.ant-table').should('exist');
  });

  it('добавляет данные о загрязнении после поиска города', () => {
    cy.visit('/location');
    cy.get('input[placeholder="Введите местоположение"]').type('Казань');
    cy.contains('button', 'Искать').click();

    cy.wait('@yandexGeocode');
    cy.wait('@getCurrentPollution');

    cy.get('.ant-table').contains('Казань').should('be.visible');
    cy.get('.ant-table').contains('Умеренно').should('be.visible');
  });
});
