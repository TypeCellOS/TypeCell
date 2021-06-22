/// <reference types="cypress" />

import { clickLastBlock, goOffline } from "../../utils";

context("Basic editor interaction", () => {
  beforeEach(() => {
    cy.visit("localhost:3000/@whatever/whatever?test");
    cy.on("uncaught:exception", () => {
      return false;
    });
  });

  it("Should convert '- ' to bullet list", () => {
    cy.get("[data-cy=list-item-block").should("not.exist");
    clickLastBlock().type("- ");
    cy.get("[data-cy=list-item-block").should("exist");
  });
});
