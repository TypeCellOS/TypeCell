import { makeObservable, observable, runInAction } from "mobx";
import { lifecycle } from "vscode-lib";
import { ConsolePayload } from "../../../../../engine/types/Engine";

interface ConsoleEvent extends ConsolePayload {
  id: string;
}

/**
 * Keeps track of console output for a cell. Appends new events to the events array.
 */
export class ConsoleOutput extends lifecycle.Disposable {
  private autorunDisposer: (() => void) | undefined;
  // Keep track of id's so every new event always has a unique id.
  private idIncrement = 1;
  public events: ConsoleEvent[] = [];

  constructor() {
    super();
    makeObservable(this, {
      events: observable.shallow,
    });
  }

  public async appendEvent(consolePayload: ConsolePayload) {
    runInAction(() => {
      if (consolePayload.level === "clear") {
        this.events = [];
      } else {
        if (this.events.length >= 999) {
          // Remove the first event when this arbitrary limit is reached to prevent memory issues.
          this.events.shift();
        }

        this.idIncrement++;
        this.events.push({
          id: this.idIncrement.toString(),
          ...consolePayload,
        });
      }
    });
  }

  public dispose() {
    if (this.autorunDisposer) {
      this.autorunDisposer();
    }
    super.dispose();
  }
}
