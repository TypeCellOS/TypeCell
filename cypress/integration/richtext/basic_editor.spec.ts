/// <reference types="cypress" />
/// <reference types="cypress-real-events" />

import { clickLastBlock, getLastBlock, goOffline } from "../../utils";

context("Basic editor interaction", () => {
  beforeEach(() => {
    cy.visit("@test/editor?test");
    getLastBlock().should("exist"); // This is needed to wait until the editor is loaded completely
    cy.on("uncaught:exception", () => {
      return false;
    });
  });

  it("Should convert '- ' to bullet list", () => {
    cy.get("[data-cy=list-item-block").should("not.exist");
    clickLastBlock().type("- ");
    cy.get("[data-cy=list-item-block").should("exist");
  });

  // it("Hover shows the drag handle", () => {
  //   cy.get("[data-cy=drag-handle").should("not.be.visible");
  //   clickLastBlock()
  //     .realHover()
  //     // .realHover({ position: "center", scrollBehavior: "nearest" })
  //     // .wait(1000)
  //     .get("[data-cy=drag-handle")
  //     .should("be.visible");
  //   // .then(() => cy.pause());
  // });

  it("Should show inline menu for selection", () => {
    cy.get("[data-cy=bubble-menu-button").should("not.exist");

    clickLastBlock().type("menu").realPress(["Shift", "ArrowLeft"]);
    cy.get("[data-cy=bubble-menu-button").should("exist");
  });

  it("Can delete block from side menu", () => {
    // Set up the block to be deleted
    clickLastBlock().type("First").realPress("Enter");
    cy.get("[data-cy=block]").should("have.length", 2);
    clickLastBlock().type("Second");
    cy.contains("Second").should("exist");

    // Open the side menu and delete
    cy.contains("Delete").should("not.exist");
    cy.get("[data-cy=drag-handle").last().invoke("show").click();
    cy.contains(/delete/i).click();
    cy.contains("Second").should("not.exist");
    cy.contains("First").should("exist");
  });
});
