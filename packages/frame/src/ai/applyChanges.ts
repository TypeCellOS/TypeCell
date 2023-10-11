import { error, uniqueId } from "@typecell-org/util";
import * as ypm from "y-prosemirror";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";
import { BlockOperation, OperationsResponse } from "./types";
import { getYjsDiffs } from "./yjsDiff";

function findBlock(id: string, data: Y.XmlFragment) {
  const node = data
    .createTreeWalker(
      (el) => el instanceof Y.XmlElement && el.getAttribute("id") === id,
    )
    .next();
  if (node.done) {
    return undefined;
  }
  return node.value as Y.XmlElement;
}

function findParentIndex(node: Y.XmlFragment) {
  const parent = node.parent as Y.XmlElement;
  for (let i = 0; i < parent.length; i++) {
    if (parent.get(i) === node) {
      return i;
    }
  }
  throw new Error("not found");
}

function updateState(
  awareness: Awareness,
  head: Y.RelativePosition,
  anchor: Y.RelativePosition,
) {
  // const initial = !awareness.states.has(99);
  awareness.states.set(99, {
    user: {
      name: "@AI",
      color: "#94FADB",
    },
    cursor: {
      anchor,
      head,
      // "anchor": {
      //     "type": {
      //         "client": 1521604366,
      //         "clock": 5
      //     },
      //     "tname": null,
      //     "item": {
      //         "client": 1521604366,
      //         "clock": 22
      //     },
      //     "assoc": 0
      // },
      // "head": {
      //     "type": {
      //         "client": 1521604366,
      //         "clock": 5
      //     },
      //     "tname": null,
      //     "item": {
      //         "client": 1521604366,
      //         "clock": 41
      //     },
      //     "assoc": 0
      // }
    },
  });

  // if (!initial) {
  //   awareness.emit("update", [
  //     {
  //       added: [99],
  //       updated: [],
  //       removed: [],
  //     },
  //     origin,
  //   ]);
  // }
  awareness.emit("change", [
    {
      added: 0,
      updated: 1,
      removed: 0,
    },
    origin,
  ]);
}

export async function applyChange(
  op: BlockOperation,
  data: Y.XmlFragment,
  awareness: Awareness,
) {
  const transact = (op: () => void) => {
    Y.transact(data.doc!, op, ypm.ySyncPluginKey);
  };
  if (op.type === "add") {
    const node = findBlock(op.afterId, data);
    if (!node) {
      throw new Error("Block not found");
    }
    const newElement = new Y.XmlElement("blockContainer");
    const child = new Y.XmlElement(op.blockType);
    child.setAttribute("id", uniqueId.generateId("block"));
    const yText = new Y.XmlText();
    child.insert(0, [yText]);
    newElement.insert(0, [child]);
    // TODO: create block
    transact(() => {
      (node.parent as Y.XmlElement).insertAfter(node, [newElement]);
    });
    // start typing text content
    for (let i = 0; i < op.content.length; i++) {
      const start = Y.createRelativePositionFromTypeIndex(yText, i);
      const end = Y.createRelativePositionFromTypeIndex(yText, i);
      updateState(awareness, start, end);
      // return new RelativeSelection(start, end, sel.getDirection())

      transact(() => {
        yText.insert(i, op.content[i]);
      });
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  } else if (op.type === "delete") {
    const node = findBlock(op.id, data);
    if (!node) {
      throw new Error("Block not found");
    }
    const blockNode = node.firstChild as Y.XmlElement;
    const yText = blockNode.firstChild as Y.XmlText;

    const start = Y.createRelativePositionFromTypeIndex(yText, 0);
    const end = Y.createRelativePositionFromTypeIndex(yText, yText.length - 1);

    updateState(awareness, start, end);

    await new Promise((resolve) => setTimeout(resolve, 200));

    transact(() => {
      (node.parent as Y.XmlElement).delete(findParentIndex(node), 1);
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
  } else if (op.type === "update") {
    const node = findBlock(op.id, data);
    if (!node) {
      throw new Error("Block not found");
    }

    // let gptCode = "\n" + gptCell.code + "\n";
    // gptCode = gptCode.replaceAll("import React from 'react';\n", "");
    // gptCode = gptCode.replaceAll("import * as React from 'react';\n", "");
    // console.log("diffs", cell.code.toJSON(), gptCode);
    const blockNode = node.firstChild as Y.XmlElement;
    const yText = blockNode.firstChild as Y.XmlText;
    const steps = getYjsDiffs(yText, op.content);
    for (const step of steps) {
      if (step.type === "insert") {
        for (let i = 0; i < step.text.length; i++) {
          const start = Y.createRelativePositionFromTypeIndex(
            yText,
            step.from + i,
          );
          const end = Y.createRelativePositionFromTypeIndex(
            yText,
            step.from + i,
          );
          updateState(awareness, start, end);
          // return new RelativeSelection(start, end, sel.getDirection())

          transact(() => {
            yText.insert(step.from + i, step.text[i]);
          });
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        // cell.code.delete(step.from, step.length);
      } else if (step.type === "delete") {
        const start = Y.createRelativePositionFromTypeIndex(yText, step.from);
        const end = Y.createRelativePositionFromTypeIndex(
          yText,
          step.from + step.length,
        );
        updateState(awareness, start, end);
        await new Promise((resolve) => setTimeout(resolve, 200));
        transact(() => {
          yText.delete(step.from, step.length);
        });
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    }
  } else {
    throw new error.UnreachableCaseError(op);
  }
}

export async function applyChanges(
  commands: OperationsResponse,
  fragment: Y.XmlFragment,
  awareness: Awareness,
) {
  const doc = new Y.Doc();

  for (const op of commands) {
    await applyChange(op, fragment, awareness);
  }
  return doc;
}
