import * as React from 'react';
import { MainApp } from '../../src/app/MainApp';

describe('Health check for Cypress component test', () => {
  it('should mount MainApp', () => {
    cy.mount(<MainApp />);
    cy.get('div').should('include.text', 'hello world');
  });
});
