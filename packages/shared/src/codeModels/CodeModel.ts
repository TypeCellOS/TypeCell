import { event, uri } from "vscode-lib";

export type CodeModel = {
  onWillDispose: event.Event<void>;
  onDidChangeContent: event.Event<void>;
  getValue(): string;
  readonly path: string;
  readonly language: string;
  readonly uri: uri.URI;
};
