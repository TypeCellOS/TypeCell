import parserTypescript from "prettier/parser-typescript";
import parserCSS from "prettier/parser-postcss";
import prettier from "prettier/standalone";
import { diffToMonacoTextEdits } from "./diffToMonacoTextEdits";
import type * as monaco from "monaco-editor";

export function setupPrettier(monacoInstance: typeof monaco) {
  monacoInstance.languages.registerDocumentFormattingEditProvider(
    "typescript",
    {
      provideDocumentFormattingEdits(model, options, token) {
        try {
          const newText = prettier.format(model.getValue(), {
            parser: "typescript",
            plugins: [parserTypescript],
            tabWidth: 2,
            printWidth: 80,
            jsxBracketSameLine: true,
          });

          let ret = diffToMonacoTextEdits(model, newText);
          return ret;
        } catch (e) {
          console.warn("error while formatting ts code (prettier)", e);
          return [];
        }
      },
    }
  );

  monacoInstance.languages.registerDocumentFormattingEditProvider("css", {
    provideDocumentFormattingEdits(model, options, token) {
      try {
        const newText = prettier.format(model.getValue(), {
          parser: "css",
          plugins: [parserCSS],
          tabWidth: 2,
          printWidth: 80,
        });

        let ret = diffToMonacoTextEdits(model, newText);
        return ret;
      } catch (e) {
        console.warn("error while formatting css code (prettier)", e);
        return [];
      }
    },
  });
}
