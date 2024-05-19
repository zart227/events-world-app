/// <reference types="cypress" />

context('Banking Project E2E Test', () => {
  beforeEach(() => {
    // Открываем страницу входа
    cy.visit('https://www.globalsqa.com/angularJs-protractor/BankingProject/#/login');
  });

  it('должен выполнить серию операций: вход, депозит, выход', () => {
    // Кликаем на кнопку "Customer Login"
    cy.get('button[ng-click="customer()"]').click();

    // Проверяем видимость выпадающего списка и выбираем пользователя
    cy.get('#userSelect').should('be.visible').select('Harry Potter').should('have.value', '2');

    // Нажимаем кнопку "Login"
    cy.get('button').contains('Login').click();

    // Кликаем на элемент "Deposit"
    cy.get('button[ng-click="deposit()"]').click();

    // Вводим сумму и нажимаем кнопку "Deposit"
    cy.get('input[ng-model="amount"]').type('300');
    cy.get('button[type="submit"]').contains('Deposit').click();

    // Проверяем наличие надписи "Deposit Successful"
    cy.get('.error').should('have.text', 'Deposit Successful');

    // Выходим из сеанса
    cy.get('button[ng-click="byebye()"]').click();
  });
});

