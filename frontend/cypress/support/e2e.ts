import './commands';

// CRA dev-server иногда бросает ошибку react-refresh в headless Cypress
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('react-refresh') || err.message.includes('webpackMissingModule')) {
    return false;
  }
  return undefined;
});
