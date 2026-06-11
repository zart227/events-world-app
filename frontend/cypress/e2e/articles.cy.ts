describe('Раздел статей', () => {
  beforeEach(() => {
    cy.setupApiMocks();
    cy.login();
  });

  const openArticlesList = () => {
    cy.visit('/articles');
    cy.contains('h1', 'Список статей').should('be.visible');
    cy.contains('Качество воздуха в городах', { timeout: 10000 }).should('be.visible');
  };

  it('отображает список статей', () => {
    openArticlesList();
    cy.contains('Как читать индекс AQI').should('be.visible');
  });

  it('ищет статьи по запросу', () => {
    openArticlesList();

    cy.get('input[placeholder="Поиск по статьям"]').type('AQI{enter}');
    cy.contains('Как читать индекс AQI').should('be.visible');
    cy.contains('Качество воздуха в городах').should('not.exist');
  });

  it('сортирует статьи по заголовку', () => {
    openArticlesList();

    cy.get('.ant-select').click();
    cy.contains('.ant-select-item-option', 'По заголовку (А-Я)').click();
    cy.get('.ant-list-item').first().should('contain', 'Как читать индекс AQI');
  });

  it('открывает страницу статьи', () => {
    openArticlesList();

    cy.contains('a', 'Качество воздуха в городах').click();
    cy.url().should('match', /\/articles\/article-1$/);
    cy.contains('h1', 'Качество воздуха в городах').should('be.visible');
    cy.contains('Первая строка статьи.').should('be.visible');
    cy.contains('a', 'Вернуться к списку статей').should('be.visible');
  });

  it('создаёт новую статью', () => {
    cy.visit('/articles/create');
    cy.contains('h1', 'Создание статьи').should('be.visible');

    cy.get('.ant-form').within(() => {
      cy.get('input').eq(0).type('Новая тестовая статья');
      cy.get('textarea').type('Полный текст новой статьи для Cypress.');
    });

    cy.contains('button', 'Создать статью').should('not.be.disabled').click();
    cy.url().should('match', /\/articles\/article-/);
    cy.contains('h1', 'Новая тестовая статья').should('be.visible');
  });

  it('удаляет статью из списка', () => {
    openArticlesList();

    cy.contains('.ant-list-item', 'Качество воздуха в городах')
      .contains('button', 'Удалить')
      .click();
    cy.contains('Качество воздуха в городах').should('not.exist');
  });

  it('удаляет статью со страницы просмотра', () => {
    cy.visit('/articles/article-1');
    cy.contains('h1', 'Качество воздуха в городах').should('be.visible');

    cy.contains('button', 'Удалить статью').click();
    cy.url().should('include', '/articles');
  });

  it('очищает весь список статей', () => {
    openArticlesList();

    cy.contains('button', 'Очистить список').click();
    cy.contains('Качество воздуха в городах').should('not.exist');
    cy.contains('Как читать индекс AQI').should('not.exist');
  });
});
