/// <reference types="cypress" />

import { getFirstBlock, goOffline } from "./utils";

context("Basic editor interaction", () => {
  // before(() => goOffline());

  beforeEach(() => {
    cy.visit("localhost:3000/@whatever/whatever?test");
    cy.on("uncaught:exception", () => {
      return false;
    });
  });

  it("Should show slash menu", () => {
    cy.get("[data-cy=suggestion-menu").should("not.exist");
    getFirstBlock().type("/");
    cy.get("[data-cy=suggestion-menu").should("exist");
    cy.get("[data-cy=selected-suggestion").should("be.visible");
  });

  it("Should convert '- ' to bullet list", () => {
    cy.get("[data-cy=list-item-block").should("not.exist");
    getFirstBlock().type("- ");
    cy.get("[data-cy=list-item-block").should("exist");
  });
});
