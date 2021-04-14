import * as monaco from "monaco-editor";
import React from 'react';
import './App.css';
import DocumentView from './DocumentView';
import { setMonacoDefaults } from "./sandbox";
import TCDocument from './store/TCDocument';
import routing from './util/routing';

setMonacoDefaults(monaco);

const nav = routing();
export const doc = TCDocument.load(nav.owner + "/" + nav.document, nav.document === "home1" ? "@yousefed/project" : "!notebook");

const App = () => {
  return <DocumentView owner={nav.owner} document={nav.document} />
};

(window as any).x = doc;
export default App;