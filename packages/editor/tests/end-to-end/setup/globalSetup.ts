// https://github.com/developit/microbundle/issues/708, otherwise vscode-lib fails
import "regenerator-runtime/runtime.js";

import { FullConfig } from "@playwright/test";
import { ensureMatrixIsRunning } from "../../util/startMatrixServer";

async function globalSetup(config: FullConfig) {
  await ensureMatrixIsRunning();
}

export default globalSetup;
