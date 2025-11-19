/// <reference types="cypress" />

describe('The City Page', () => {
	before(() => {
	  cy.login(Cypress.env('test_email'), Cypress.env('test_password'));
	});
  
	it('successfully loads', () => {
	  cy.visit('/city');
	  cy.get('input#address').type(`Казань{enter}`);
	  cy.get('table').contains('Казань').parent().find('span.ant-tag').should('exist');
	});
  });
  