import { observer } from "mobx-react-lite";
import * as monaco from "monaco-editor";
import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./App.css";
import DocumentView from "./app/documentRenderers/DocumentView";
// import { enablePluginSystem } from "./pluginEngine/pluginSystem.ts.bak";
import { setMonacoDefaults } from "./runtime/editor";
import setupNpmTypeResolver from "./runtime/editor/languages/typescript/plugins/npmTypeResolver";
import setupTypecellTypeResolver from "./runtime/editor/languages/typescript/plugins/typecellTypeResolver";
import { MonacoContext } from "./runtime/editor/MonacoContext";
import { DocumentResource } from "./store/DocumentResource";
import { getStoreService, initializeStoreService } from "./store/local/stores";

initializeStoreService();
setMonacoDefaults(monaco);
setupTypecellTypeResolver(monaco);
setupNpmTypeResolver(monaco);
// enablePluginSystem();

const nav = getStoreService().navigationStore;
nav.initialize();

const App = observer(() => {
  return (
    <MonacoContext.Provider value={{ monaco }}>
      <DndProvider backend={HTML5Backend}>
        {nav.currentPage.page === "document" && (
          <DocumentView id={nav.currentPage.identifier} />
        )}
        {nav.currentPage.page === "root" && <div>Welcome to Typecell</div>}
        {nav.currentPage.page === "owner" && (
          <div>Profile: {nav.currentPage.owner}</div>
        )}
      </DndProvider>
    </MonacoContext.Provider>
  );
});

(window as any).DocumentResource = DocumentResource; // TODO: hacky

export default App;
