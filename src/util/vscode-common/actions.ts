import { IDisposable } from "./lifecycle";

export interface IAction extends IDisposable {
  readonly id: string;
  label: string;
  tooltip: string;
  class: string | undefined;
  enabled: boolean;
  checked: boolean;
  run(event?: unknown): Promise<unknown>;
}
