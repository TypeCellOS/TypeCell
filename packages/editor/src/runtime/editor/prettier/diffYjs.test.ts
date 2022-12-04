/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { applyYjsDiffs } from "./diffYjs";

describe("diffYjs", () => {
  it("basic replace", () => {
    const doc = new Y.Doc();

    // const text = new Y.Text("hello world");
    const text = doc.getText("text");
    text.insert(0, "hello world");
    applyYjsDiffs(text, "hello there world");
    expect(text.toJSON()).toEqual("hello there world");
  });

  it("delete", () => {
    const doc = new Y.Doc();

    // const text = new Y.Text("hello world");
    const text = doc.getText("text");
    text.insert(0, "hello there world");
    applyYjsDiffs(text, "hello world");
    expect(text.toJSON()).toEqual("hello world");
  });

  it("insert and delete", () => {
    const doc = new Y.Doc();

    // const text = new Y.Text("hello world");
    const text = doc.getText("text");
    text.insert(0, "hello there world");
    applyYjsDiffs(text, "hell crazy world. How are you?");
    expect(text.toJSON()).toEqual("hell crazy world. How are you?");
  });

  it("advanced", () => {
    const orig = `// This generates an array of numbers 1 through 10
    export let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];`;

    const newText = ` 

    // This cell exports an array of numbers 1 through 9
    
    export let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    `;

    const doc = new Y.Doc();

    // const text = new Y.Text("hello world");
    const text = doc.getText("text");
    text.insert(0, orig);
    applyYjsDiffs(text, newText);
    expect(text.toJSON()).toEqual(newText);
  });
});
