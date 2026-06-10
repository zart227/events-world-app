describe('Login', () => {
	beforeEach(() => {
	  cy.login(Cypress.env('test_email'), Cypress.env('test_password'));
	});
  
	it('logged and page is available', () => {
	  cy.visit('/pollution');
	});
  });
  