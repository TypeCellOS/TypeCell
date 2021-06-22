/// <reference types="cypress" />

export const goOffline = () => {
  cy.log("**go offline**")
    .then(() => {
      return Cypress.automation("remote:debugger:protocol", {
        command: "Network.enable",
      });
    })
    .then(() => {
      return Cypress.automation("remote:debugger:protocol", {
        command: "Network.emulateNetworkConditions",
        params: {
          offline: true,
          latency: -1,
          downloadThroughput: -1,
          uploadThroughput: -1,
        },
      });
    });
};

export const getFirstBlock = () => {
  let block = cy.get("[data-cy=block]");
  try {
    block.click();
  } catch (any) {
    cy.get("[data-cy=block]").click();
  } finally {
    return cy.focused();
  } // Focuses the editor where a user can type
};
