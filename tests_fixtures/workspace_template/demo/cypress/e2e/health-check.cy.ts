describe('Health check for Cypress e2e test', () => {
  it('should visit the home page', () => {
    cy.visit('/');
    cy.get('#main').should('include.text', 'hello world');
  });
});
