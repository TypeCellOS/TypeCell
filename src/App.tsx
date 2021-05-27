import { observer } from "mobx-react-lite";
import * as monaco from "monaco-editor";
import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./App.css";
import DocumentView from "./documentRenderers/DocumentView";
import { enablePluginSystem } from "./pluginEngine/pluginSystem";
import { setMonacoDefaults } from "./sandbox";
import setupNpmTypeResolver from "./sandbox/setupNpmTypeResolver";
import setupTypecellTypeResolver from "./sandbox/setupTypecellTypeResolver";
import { setupSearch } from "./search";
import { DocumentResource } from "./store/DocumentResource";
import { navigationStore } from "./store/local/stores";

setupSearch();
setMonacoDefaults(monaco);
setupTypecellTypeResolver();
setupNpmTypeResolver();
enablePluginSystem();

const nav = navigationStore;

const App = observer(() => {
  return (
    <DndProvider backend={HTML5Backend}>
      {nav.currentPage.page === "document" && (
        <DocumentView id={nav.currentPage} />
      )}
      {nav.currentPage.page === "root" && <div>Welcome to Typecell</div>}
      {nav.currentPage.page === "owner" && (
        <div>Profile: {nav.currentPage.owner}</div>
      )}
    </DndProvider>
  );
});

(window as any).DocumentResource = DocumentResource; // TODO: hacky

export default App;
