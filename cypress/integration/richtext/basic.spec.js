/**
 * This file covers end-to-end tests for testing basic functionalities of the rich-text editor
 */

context("Basics", () => {
  beforeEach(() => {
    cy.visit("localhost:3000");

    cy.on("uncaught:exception", () => {
      return false;
    });
  });

  // it("Should login", () => {

  // });

  it("Should create new page", () => {
    cy.contains("Sign in").click();
    cy.get("[name='username']").type("pvunderink");
    cy.get("[name='password']").type("Br48P#BXs4HN$ToF");
    cy.get("[type='submit']").click();

    cy.get("[data-testid='profileButton']").click();
    cy.contains("New page").click();
    cy.get("[name='title']").type("test{enter}");
  });
});
