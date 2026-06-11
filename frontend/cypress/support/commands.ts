/// <reference types="cypress" />

import { setupCommonApiMocks } from './apiMocks';

type AuthUser = {
  id: string;
  email: string;
  role: string;
};

const fillAuthForm = (email: string, password: string) => {
  cy.get('.ant-tabs-tabpane-active').within(() => {
    cy.get('input[placeholder="Email"]').clear().type(email);
    cy.get('input[placeholder="Пароль"]').clear().type(password);
  });
};

const assertLocationPage = () => {
  cy.url().should('include', '/location');
  cy.get('input[placeholder="Введите местоположение"]').should('be.visible');
};

Cypress.Commands.add('setupApiMocks', () => {
  setupCommonApiMocks();
});

Cypress.Commands.add('authenticate', (email?: string) => {
  const userEmail = email ?? Cypress.env('test_email');

  cy.fixture('auth').then((auth) => {
    const user: AuthUser = { ...auth.user, email: userEmail };
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify(user));
      win.localStorage.setItem('accessToken', auth.accessToken);
    });
  });
});

Cypress.Commands.add('loginViaUi', (email?: string, password?: string) => {
  const testEmail = email ?? Cypress.env('test_email');
  const testPassword = password ?? Cypress.env('test_password');

  if (!Cypress.env('useRealApi')) {
    cy.setupApiMocks();
  }

  cy.visit('/login');
  fillAuthForm(testEmail, testPassword);
  cy.contains('button', 'Войти').should('not.be.disabled').click();

  if (!Cypress.env('useRealApi')) {
    cy.wait('@authLogin');
  }

  assertLocationPage();
  cy.window().its('localStorage.user').should('exist');
});

Cypress.Commands.add('login', (email?: string, password?: string) => {
  const testEmail = email ?? Cypress.env('test_email');
  const testPassword = password ?? Cypress.env('test_password');

  cy.session(
    [testEmail, testPassword, Cypress.env('useRealApi')],
    () => {
      cy.loginViaUi(testEmail, testPassword);
    },
    {
      validate() {
        cy.window().then((win) => {
          expect(win.localStorage.getItem('user')).to.exist;
        });
      },
    },
  );
});

Cypress.Commands.add('assertLocationPage', assertLocationPage);

Cypress.Commands.add('logoutViaUi', () => {
  cy.get('[data-role="logout"]').click();
  cy.url().should('include', '/login');
  cy.window().its('localStorage.user').should('not.exist');
});

declare global {
  namespace Cypress {
    interface Chainable {
      setupApiMocks(): Chainable<void>;
      authenticate(email?: string): Chainable<void>;
      assertLocationPage(): Chainable<void>;
      loginViaUi(email?: string, password?: string): Chainable<void>;
      login(email?: string, password?: string): Chainable<void>;
      logoutViaUi(): Chainable<void>;
    }
  }
}

export {};
