import { KeyboardEvent, useRef, useState } from "react";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";
import { GPTSession } from "../../../../gpt";
import { applyYjsDiffs } from "../../../../runtime/editor/prettier/diffYjs";
import { DocumentResource } from "../../../../store/DocumentResource";
import styles from "./gptarea.module.css";

const gpt = new GPTSession();

export function parseResponse(response: string) {
  //   const parts = response.split(/CELL (\d+)/g);

  const matches = [...response.matchAll(/CELL (\d+):[\n\s]+```(.*?)```/gs)].map(
    (m) => ({
      cellIndex: parseInt(m[1]),
      code: m[2].trim(),
    })
  );
  return matches;
}

function getCodeCells(document: DocumentResource) {
  return document.cells.filter((c) => c.language === "typescript");
}

function updateState(
  awareness: Awareness,
  head: Y.RelativePosition,
  anchor: Y.RelativePosition
) {
  // const initial = !awareness.states.has(99);
  awareness.states.set(99, {
    user: {
      name: "@GPT",
      color: "#94FADB",
    },
    selection: {
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

export function GPTArea(props: { document: DocumentResource }) {
  const textareaRef = useRef<any>();
  const [focused, setFocused] = useState(false);
  const [status, setStatus] = useState("prompt");

  function focus() {
    setFocused(true);
  }
  function blur() {
    setFocused(false);
  }

  function shuffle(array: any[]) {
    let currentIndex = array.length,
      randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }

    return array;
  }

  async function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter") {
      return;
    }

    // const gptAwareness = new Awareness(props.document.data.doc!);
    // gptAwareness.
    // debugger;
    e.preventDefault();
    textareaRef.current!.blur();
    setStatus("loading");

    try {
      // await new Promise((resolve) => setTimeout(resolve, 4000));

      // await new Promise((resolve) => setTimeout(resolve, 2000));

      // return;
      if (!gpt.Initialized) {
        await gpt.initialize();
      }
      const text = textareaRef.current.value;
      const response = await gpt.request({ message: text });

      textareaRef.current!.value = "";
      setStatus("");

      const parsed = parseResponse(response.content);
      console.log(parsed);
      let codeCells = getCodeCells(props.document);

      for (let gptCell of parsed) {
        let cell = codeCells[gptCell.cellIndex - 1];

        if (!cell) {
          console.log("create cell");
          props.document.cellList.addCell(
            props.document.cells.length,
            "typescript",
            ""
          );
          codeCells = getCodeCells(props.document);
          cell = codeCells[gptCell.cellIndex - 1];
        }

        let gptCode = "\n" + gptCell.code + "\n";
        gptCode = gptCode.replaceAll("import React from 'react';\n", "");
        gptCode = gptCode.replaceAll("import * as React from 'react';\n", "");
        console.log("diffs", cell.code.toJSON(), gptCode);
        const steps = applyYjsDiffs(cell.code, gptCode);

        for (let step of steps) {
          if (step.type === "insert") {
            for (let i = 0; i < step.text.length; i++) {
              const start = Y.createRelativePositionFromTypeIndex(
                cell.code,
                step.from + i
              );
              const end = Y.createRelativePositionFromTypeIndex(
                cell.code,
                step.from + i
              );
              updateState(props.document.webrtcProvider!.awareness, start, end);
              // return new RelativeSelection(start, end, sel.getDirection())

              cell.code.insert(step.from + i, step.text[i]);
              await new Promise((resolve) => setTimeout(resolve, 20));
            }
            // cell.code.delete(step.from, step.length);
          } else if (step.type === "delete") {
            const start = Y.createRelativePositionFromTypeIndex(
              cell.code,
              step.from
            );
            const end = Y.createRelativePositionFromTypeIndex(
              cell.code,
              step.from + step.length
            );
            updateState(props.document.webrtcProvider!.awareness, start, end);
            await new Promise((resolve) => setTimeout(resolve, 200));
            cell.code.delete(step.from, step.length);
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 500));

        // const diff = cell.code.delete(0, cell.code.length);
        // cell.code.insert(0, gptCell.code);
        // textareaRef.current!.value = "";
      }
    } catch (e) {
      console.error(e);
      debugger;
    } finally {
      setStatus("prompt");
    }
  }
  return (
    <div className={styles.div + " " + styles[status]}>
      <textarea
        className={styles.whenPrompt}
        onKeyDown={onKeyDown}
        ref={textareaRef}
        placeholder={focused ? "" : "What do you want to build?"}
        onFocus={focus}
        onBlur={blur}
      />

      <div className={styles.whenLoading}>Thinking...</div>
      {/* <button onClick={submit}>submit</button> */}
    </div>
  );
}
