import { makeObservable, observable } from "mobx";
import { CodeModel } from "../engine/CodeModel";
import { Emitter, Event } from "../util/vscode-common/event";
import { Disposable } from "../util/vscode-common/lifecycle";

export class FrameCodeModel extends Disposable implements CodeModel {
  private _javascriptCode: string;
  private readonly _onWillDispose: Emitter<void> = this._register(
    new Emitter<void>()
  );
  public readonly onWillDispose: Event<void> = this._onWillDispose.event;

  private readonly _onDidChangeContent: Emitter<void> = this._register(
    new Emitter<void>()
  );
  public readonly onDidChangeContent: Event<void> =
    this._onDidChangeContent.event;

  public readonly positions = {
    x: 0,
    y: 0,
  };

  constructor(public readonly path: string, code: string) {
    super();
    this._javascriptCode = code;
    makeObservable(this, {
      positions: observable.deep,
    });
  }

  getValue(): string {
    return this._javascriptCode;
  }

  async getCompiledJavascriptCode(): Promise<string> {
    return this._javascriptCode;
  }

  public language: "javascript" = "javascript";

  public setValue(code: string) {
    this._javascriptCode = code;
    this._onDidChangeContent.fire();
  }

  public dispose() {
    this._onWillDispose.fire();
    super.dispose();
  }
}
