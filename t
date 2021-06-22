[1mdiff --git a/cypress/integration/richtext/basicEditor.spec.ts b/cypress/integration/richtext/basicEditor.spec.ts[m
[1mnew file mode 100644[m
[1mindex 0000000..a44539c[m
[1m--- /dev/null[m
[1m+++ b/cypress/integration/richtext/basicEditor.spec.ts[m
[36m@@ -0,0 +1,29 @@[m
[32m+[m[32m/// <reference types="cypress" />[m
[32m+[m
[32m+[m[32mimport { getFirstBlock, goOffline } from "./utils";[m
[32m+[m
[32m+[m[32mcontext("Basic editor interaction", () => {[m
[32m+[m[32m  before(() => goOffline());[m
[32m+[m
[32m+[m[32m  beforeEach(() => {[m
[32m+[m[32m    cy.visit("localhost:3000/@nzhlebinkov/test");[m
[32m+[m[32m    cy.on("uncaught:exception", () => {[m
[32m+[m[32m      return false;[m
[32m+[m[32m    });[m
[32m+[m[32m  });[m
[32m+[m
[32m+[m[32m  it("Should show slash menu", () => {[m
[32m+[m[32m    cy.get("[data-cy=suggestion-menu").should("not.exist");[m
[32m+[m[32m    getFirstBlock().type("/");[m
[32m+[m[32m    // cy.get("[data-cy=block]").click(); // Focuses the editor where a user can type[m
[32m+[m[32m    // cy.focused().type("/");[m
[32m+[m[32m    cy.get("[data-cy=suggestion-menu").should("exist");[m
[32m+[m[32m    cy.get("[data-cy=selected-suggestion").should("be.visible");[m
[32m+[m[32m  });[m
[32m+[m
[32m+[m[32m  it("Should convert '- ' to bullet list", () => {[m
[32m+[m[32m    cy.get("[data-cy=list-item-block").should("not.exist");[m
[32m+[m[32m    getFirstBlock().type("- ");[m
[32m+[m[32m    cy.get("[data-cy=list-item-block").should("exist");[m
[32m+[m[32m  });[m
[32m+[m[32m});[m
[1mdiff --git a/cypress/integration/richtext/loggedInStub.spec.ts b/cypress/integration/richtext/loggedInStub.spec.ts[m
[1mdeleted file mode 100644[m
[1mindex 6104aaa..0000000[m
[1m--- a/cypress/integration/richtext/loggedInStub.spec.ts[m
[1m+++ /dev/null[m
[36m@@ -1,19 +0,0 @@[m
[31m-/// <reference types="cypress" />[m
[31m-[m
[31m-context("Basics", () => {[m
[31m-  beforeEach(() => {[m
[31m-    cy.visit("localhost:3000/@nzhlebinkov/test");[m
[31m-[m
[31m-    cy.on("uncaught:exception", () => {[m
[31m-      return false;[m
[31m-    });[m
[31m-  });[m
[31m-[m
[31m-  it("Should create new page", () => {[m
[31m-    cy.get("[data-cy=suggestion-menu").should("not.exist");[m
[31m-    cy.get("[data-cy=block]").click(); // Focuses the editor where a user can type[m
[31m-    cy.focused().type("/");[m
[31m-    cy.get("[data-cy=suggestion-menu").should("exist");[m
[31m-    cy.get("[data-cy=selected-suggestion").should("be.visible");[m
[31m-  });[m
[31m-});[m
[1mdiff --git a/cypress/integration/richtext/utils.tsx b/cypress/integration/richtext/utils.tsx[m
[1mnew file mode 100644[m
[1mindex 0000000..6649973[m
[1m--- /dev/null[m
[1m+++ b/cypress/integration/richtext/utils.tsx[m
[36m@@ -0,0 +1,32 @@[m
[32m+[m[32m/// <reference types="cypress" />[m
[32m+[m
[32m+[m[32mexport const goOffline = () => {[m
[32m+[m[32m  cy.log("**go offline**")[m
[32m+[m[32m    .then(() => {[m
[32m+[m[32m      return Cypress.automation("remote:debugger:protocol", {[m
[32m+[m[32m        command: "Network.enable",[m
[32m+[m[32m      });[m
[32m+[m[32m    })[m
[32m+[m[32m    .then(() => {[m
[32m+[m[32m      return Cypress.automation("remote:debugger:protocol", {[m
[32m+[m[32m        command: "Network.emulateNetworkConditions",[m
[32m+[m[32m        params: {[m
[32m+[m[32m          offline: true,[m
[32m+[m[32m          latency: -1,[m
[32m+[m[32m          downloadThroughput: -1,[m
[32m+[m[32m          uploadThroughput: -1,[m
[32m+[m[32m        },[m
[32m+[m[32m      });[m
[32m+[m[32m    });[m
[32m+[m[32m};[m
[32m+[m
[32m+[m[32mexport const getFirstBlock = () => {[m
[32m+[m[32m  let block = cy.get("[data-cy=block]");[m
[32m+[m[32m  try {[m
[32m+[m[32m    block.click();[m
[32m+[m[32m  } catch (any) {[m
[32m+[m[32m    cy.get("[data-cy=block]").click();[m
[32m+[m[32m  } finally {[m
[32m+[m[32m    return cy.focused();[m
[32m+[m[32m  } // Focuses the editor where a user can type[m
[32m+[m[32m};[m
[1mdiff --git a/src/documentRenderers/richtext/RichTextRenderer.tsx b/src/documentRenderers/richtext/RichTextRenderer.tsx[m
[1mindex 74ffb89..b167f8c 100644[m
[1m--- a/src/documentRenderers/richtext/RichTextRenderer.tsx[m
[1m+++ b/src/documentRenderers/richtext/RichTextRenderer.tsx[m
[36m@@ -132,7 +132,12 @@[m [mconst RichTextRenderer: React.FC<Props> = observer((props) => {[m
         placeholder: "Enter text or type '/' for commands",[m
         placeholderOnlyWhenSelected: true,[m
       }),[m
[31m-      ListItemBlock.configure({ placeholder: "List item" }),[m
[32m+[m[32m      ListItemBlock.configure({[m
[32m+[m[32m        placeholder: "List item",[m
[32m+[m[32m        HTMLAttributes: {[m
[32m+[m[32m          "data-cy": "list-item-block",[m
[32m+[m[32m        },[m
[32m+[m[32m      }),[m
       TableBlock,[m
       IndentItemBlock.configure({[m
         HTMLAttributes: {[m
