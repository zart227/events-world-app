describe('Навигация в шапке', () => {
  beforeEach(() => {
    cy.setupApiMocks();
    cy.login();
  });

  it('показывает пункты меню для авторизованного пользователя', () => {
    cy.visit('/location');
    cy.get('.ant-menu').within(() => {
      cy.contains('О нас').should('be.visible');
      cy.contains('Местоположение').should('be.visible');
      cy.contains('Информация о городе').should('be.visible');
      cy.contains('Статьи').should('be.visible');
      cy.contains(Cypress.env('test_email')).should('be.visible');
      cy.contains('Выйти').should('be.visible');
    });
  });

  it('переходит на страницу статей', () => {
    cy.visit('/location');
    cy.get('.ant-menu').contains('Статьи').click();
    cy.url().should('include', '/articles');
    cy.contains('h1', 'Список статей').should('be.visible');
  });

  it('переходит на страницу информации о городе', () => {
    cy.visit('/location');
    cy.get('.ant-menu').contains('Информация о городе').click();
    cy.url().should('include', '/city-info');
    cy.contains('h1', 'Информация о городе').should('be.visible');
  });
});

describe('Навигация для гостя', () => {
  beforeEach(() => {
    cy.setupApiMocks();
  });

  it('показывает вход и регистрацию', () => {
    cy.visit('/login');
    cy.get('.ant-menu').within(() => {
      cy.contains('Вход').should('be.visible');
      cy.contains('Регистрация').should('be.visible');
    });
  });
});
