import { FullConfig } from "@playwright/test";
import { ensureMatrixIsRunning } from "../../util/startMatrixServer";

async function globalSetup(config: FullConfig) {
  await ensureMatrixIsRunning();
}

export default globalSetup;
