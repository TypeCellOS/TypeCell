/// <reference types="cypress" />

context("Basics", () => {
  beforeEach(() => {
    cy.visit("localhost:3000/@nzhlebinkov/test");

    cy.on("uncaught:exception", () => {
      return false;
    });
  });

  it("Should create new page", () => {
    cy.get("[data-cy=suggestion-menu").should("not.exist");
    cy.get("[data-cy=block]").click(); // Focuses the editor where a user can type
    cy.focused().type("/");
    cy.get("[data-cy=suggestion-menu").should("exist");
    cy.get("[data-cy=selected-suggestion").should("be.visible");
  });
});
