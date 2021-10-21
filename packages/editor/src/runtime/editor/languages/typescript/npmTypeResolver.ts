// import { detectNewImportsToAcquireTypeFor } from "./typeAcquisition";
import type * as monaco from "monaco-editor";
import * as ts from "typescript";
import * as ata from "@typescript/ata";

export default function setupNpmTypeResolver(monacoInstance: typeof monaco) {
  /*
TODO:
issues with ata package:
- seems way more inefficient (3x files for react-vega)

to solve
- loading "!@user/other-notebook-types"
- loading "typecell" modules

*/

  const acquirer = ata.setupTypeAcquisition({
    projectName: "TypeCell",
    typescript: ts,
    logger: console,
    delegate: {
      receivedFile: (code: string, path: string) => {
        console.log("ATA received", path);
        monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
          code,
          "file://" + path
        );
        // Add code to your runtime at the path...
      },
      started: () => {
        console.log("ATA start");
      },
      progress: (downloaded: number, total: number) => {
        console.log(`Got ${downloaded} out of ${total}`);
      },
      finished: (vfs) => {
        console.log("ATA done", vfs);
      },
    },
  });
  monacoInstance.editor.onDidCreateModel((model) => {
    if (!model.uri.path.startsWith("/!@") /*!@*/) {
      return;
    }

    // TODO: check language

    model.onDidChangeContent(() => {
      acquirer(model.getValue());
    });
    acquirer(model.getValue());
  });

  // always import react types, as this library is imported by default in ts.worker
  acquirer(`import * as React from "react"`);
}
