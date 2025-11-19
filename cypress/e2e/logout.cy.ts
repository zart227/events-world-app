describe('Login then logout', () => {
	it('login first then clears localStorage user object and redirect to login', () => {
	  cy.login(Cypress.env('test_email'), Cypress.env('test_password'));
	  cy.visit('/pollution');
  
	  context(' ждём 3 секунды, потом logout', () => {
		cy.wait(3000);
		cy.get('button[data-role="logout"]').click();
		cy.url().should('include', '/login');
		cy.getAllLocalStorage().then((result) => {
		  if (result.hasOwnProperty(Cypress.config('baseUrl'))) {
			expect(result[Cypress.config('baseUrl')]).not.to.have.property('user');
		  }
		});
		cy.get('header').find('button[data-role="logout"]').should('not.exist');
	  });
	});
  });
  