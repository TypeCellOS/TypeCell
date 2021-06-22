/// <reference types="cypress" />

import { clickLastBlock, getLastBlock, getNthBlock } from "../../utils";

import defaultCommands from "../../../src/documentRenderers/richtext/extensions/slashcommand/defaultCommands";

function repeat(str: string, n: number): string {
  let result = "";

  for (let i = 0; i < n; i++) {
    result += str;
  }

  return result;
}

context("Slash-command menu integration tests", () => {
  beforeEach(() => {
    cy.visit("localhost:3000/@whatever/whatever?test");
    cy.on("uncaught:exception", () => {
      return false;
    });
  });

  it("Should show slash menu when / is typed", () => {
    cy.get("[data-cy=suggestion-menu]").should("not.exist");
    clickLastBlock().type("/");
    cy.get("[data-cy=suggestion-menu]").should("exist");
    cy.get("[data-cy=selected-suggestion]").should("be.visible");
  });

  it("Should hide slash menu when no matches are found and more than 3 characters are typed", () => {
    clickLastBlock().type("/h1");
    cy.get("[data-cy=suggestion-menu]").should("exist");

    getLastBlock().type("~~~~");
    cy.get("[data-cy=suggestion-menu]").should("not.exist");
  });

  it("Should filter all default commands properly", () => {
    cy.get("[data-cy=suggestion-menu]").should("not.exist");

    for (const commandName in defaultCommands) {
      const command = defaultCommands[commandName];

      // Type command
      clickLastBlock().type(`/${command.name}`);

      cy.get("[data-cy=selected-suggestion]").should("be.visible");
      cy.get("[data-cy=suggestion-menu]").contains(command.name);

      // Remove command with repeated backspaces
      getLastBlock().type(repeat("{backspace}", command.name.length + 1));
    }
  });

  it("Should create headings properly", () => {
    const headings = ["h1", "h2", "h3", "h4", "h5", "h6"];

    headings.forEach((heading) => {
      // Type command in trailing paragraph and press enter
      clickLastBlock().type(`/${heading}{enter}`);

      // Check whether the appropriate heading element exists in the second to last block
      getNthBlock(-1).get(heading).should("exist");
    });
  });
});
