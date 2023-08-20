import type * as monaco from "monaco-editor";
import { diffToMonacoTextEdits } from "./diffToMonacoTextEdits";

// TODO: move prettier to shared webworker or host frame?
export function setupPrettier(monacoInstance: typeof monaco) {
  monacoInstance.languages.registerDocumentFormattingEditProvider(
    "typescript",
    {
      async provideDocumentFormattingEdits(model, options, token) {
        try {
          const prettier = await import("prettier/standalone");
          const parserTypescript = await import("prettier/parser-typescript");
          const newText = prettier.format(model.getValue(), {
            parser: "typescript",
            plugins: [parserTypescript],
            tabWidth: 2,
            printWidth: 80,
            jsxBracketSameLine: true,
          });

          const ret = diffToMonacoTextEdits(
            model,
            newText.substring(0, newText.length - 1) // disable last \n added by prettier
          );
          return ret;
        } catch (e) {
          console.warn("error while formatting ts code (prettier)", e);
          return [];
        }
      },
    }
  );

  monacoInstance.languages.registerDocumentFormattingEditProvider("css", {
    async provideDocumentFormattingEdits(model, options, token) {
      const prettier = await import("prettier/standalone");
      const parserCSS = await import("prettier/parser-postcss");
      try {
        const newText = prettier.format(model.getValue(), {
          parser: "css",
          plugins: [parserCSS],
          tabWidth: 2,
          printWidth: 80,
        });

        const ret = diffToMonacoTextEdits(model, newText);
        return ret;
      } catch (e) {
        console.warn("error while formatting css code (prettier)", e);
        return [];
      }
    },
  });
}
