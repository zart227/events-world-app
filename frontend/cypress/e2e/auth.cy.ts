describe('Аутентификация', () => {
  beforeEach(() => {
    cy.setupApiMocks();
  });

  it('отображает форму входа на /login', () => {
    cy.visit('/login');
    cy.get('.ant-tabs-tab-active').should('contain', 'Вход');
    cy.get('input[placeholder="Email"]').should('be.visible');
    cy.get('input[placeholder="Пароль"]').should('be.visible');
    cy.contains('button', 'Войти').should('be.visible');
  });

  it('отображает форму регистрации на /register', () => {
    cy.visit('/register');
    cy.get('.ant-tabs-tab-active').should('contain', 'Регистрация');
    cy.get('input[placeholder="Подтверждение пароля"]').should('be.visible');
    cy.contains('button', 'Зарегистрироваться').should('be.visible');
  });

  it('переключает вкладки входа и регистрации', () => {
    cy.visit('/login');
    cy.contains('.ant-tabs-tab', 'Регистрация').click();
    cy.url().should('include', '/register');
    cy.contains('.ant-tabs-tab', 'Вход').click();
    cy.url().should('include', '/login');
  });

  it('блокирует кнопку входа при невалидном email', () => {
    cy.visit('/login');
    cy.get('input[placeholder="Email"]').type('not-an-email');
    cy.get('input[placeholder="Пароль"]').type('secret');
    cy.contains('button', 'Войти').should('be.disabled');
  });

  it('успешно регистрирует пользователя', () => {
    cy.visit('/register');
    cy.get('.ant-tabs-tabpane-active').within(() => {
      cy.get('input[placeholder="Email"]').type('newuser@test.local');
      cy.get('input[placeholder="Пароль"]').type('secret');
      cy.get('input[placeholder="Подтверждение пароля"]').type('secret');
      cy.contains('button', 'Зарегистрироваться').should('not.be.disabled').click();
    });
    cy.wait('@authRegister');
    cy.assertLocationPage();
  });

  it('перенаправляет авторизованного пользователя с /login на /location', () => {
    cy.login();
    cy.visit('/login');
    cy.url().should('include', '/location');
  });
});
