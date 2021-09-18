// mock necessary for monaco
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

// import "monaco-editor" doesn't work in jest
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import { diffToMonacoTextEdits } from "../diffToMonacoTextEdits";

function applyTest(v1: string, v2: string) {
  const model = monaco.editor.createModel(v1);
  const edits = diffToMonacoTextEdits(model, v2);
  model.applyEdits(edits);
  expect(model.getValue()).toEqual(v2);
  return edits;
}

it("basic replace", () => {
  const edits = applyTest("hello", "hi");
  expect(edits).toHaveLength(1);
});

it("basic add", () => {
  const edits = applyTest("hello", "hello 2");
  expect(edits).toHaveLength(1);
});

it("basic delete", () => {
  const edits = applyTest("hello there", "hello");
  expect(edits).toHaveLength(1);
});

it("no change", () => {
  const edits = applyTest("hello there", "hello there");
  expect(edits).toHaveLength(0);
});

it("multiline change", () => {
  const edits = applyTest(
    `// hello
  let x  = 4;
  let y  = 2;`,
    `// hello
  let x = 4;
  let y = 2;
  `
  );
  expect(edits).toHaveLength(2);
});

it("large change", () => {
  const edits = applyTest(
    `import * as monaco from "monaco-editor";
    import React from "react";
    import { DndProvider } from "react-dnd";
    import { HTML5Backend } from "react-dnd-html5-backend";
    import "./App.css";
    import DocumentView from "./DocumentView";
    import { enablePluginSystem } from "./pluginEngine/pluginSystem";
    import { setMonacoDefaults } from "./sandbox";
    import setupNpmTypeResolver from "./sandbox/setupNpmTypeResolver";
    import setupTypecellTypeResolver from "./sandbox/setupTypecellTypeResolver";
    import { DocumentResource } from "./store/DocumentResource";
    import routing from "./typecellEngine/lib/routing";
    
    setMonacoDefaults(monaco);
    setupTypecellTypeResolver();
    setupNpmTypeResolver();
    enablePluginSystem();
    
    const nav = routing();
    
    const App = () => {
      return (
        <DndProvider backend={HTML5Backend}>
          <DocumentView owner={nav.owner} document={nav.document} />
        </DndProvider>
      );
    };
    
    (window as any).DocumentResource = DocumentResource; // TODO: hacky
    
    export default App;
    `,
    `import * as monaco from "monaco-editor";
    import React from "react";
    import { DndProvider } from "react-dnd";
    import { HTML5Backend } from "react-dnd-html5-backend";
    import DocumentView from "./DocumentView";
    import { enablePluginSystem } from "./pluginEngine/pluginSystem";
    import { setMonacoDefaults } from "./sandbox";
    import setupNpmTypeResolver from "./sandbox/setupNpmTypeResolver";
    import setupTypecellTypeResolver from "./setupTypecellTypeResolver";
    import { DocumentResource } from "./store/DocumentResource";
    import routing from "./typecellEngine/lib/routing";
    
    setMonacoDefaults(awesome);
    setupTypecellTypeResolver();
    
    const nav = routing();
    
    const App = () => {
      return (
        <DndProvider backend={HTML5Backend}>
      <DocumentView owner={nav.owner} document={nav.document} />
      <div />
        </DndProvider>
      );
    };
    
    (window as any).DocumentResource = DocumentResource; // TODO: hacky
    
    export default App;
    `
  );
  expect(edits).toHaveLength(7);
});
