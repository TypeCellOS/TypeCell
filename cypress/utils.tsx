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

export const getNthBlock = (n: number) => {
  return cy.get("[data-cy=block]").eq(n);
};

export const getLastBlock = () => {
  return cy.get("[data-cy=block]").last();
};

export const clickLastBlock = () => {
  return getLastBlock().click();
};
