import { makeObservable, observable, runInAction } from "mobx";
import { lifecycle } from "vscode-lib";
import { ConsolePayload } from "../../../../../engine/types/Engine";

/**
 * Keeps track of console output for a cell. Appends new events to the events array.
 */
export class ConsoleOutput extends lifecycle.Disposable {
  private autorunDisposer: (() => void) | undefined;
  public events: ConsolePayload[] = [];

  constructor() {
    super();
    makeObservable(this, {
      events: observable,
    });
  }

  async appendEvent(consolePayload: ConsolePayload) {
    runInAction(() => {
      this.events.push(consolePayload);
    });
  }

  public dispose() {
    if (this.autorunDisposer) {
      this.autorunDisposer();
    }
    super.dispose();
  }
}
