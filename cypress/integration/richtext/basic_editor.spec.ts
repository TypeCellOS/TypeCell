/// <reference types="cypress" />
/// <reference types="cypress-real-events" />

import { clickLastBlock, getLastBlock, goOffline } from "../../utils";

context("Basic editor interaction", () => {
  beforeEach(() => {
    cy.visit("localhost:3000/@test/editor?test");
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
});
