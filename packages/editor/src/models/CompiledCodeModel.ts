import { CodeModel } from "@typecell-org/engine";
import { event, lifecycle } from "vscode-lib";

export class CompiledCodeModel
  extends lifecycle.Disposable
  implements CodeModel
{
  private _javascriptCode: string;
  private readonly _onWillDispose: event.Emitter<void> = this._register(
    new event.Emitter<void>()
  );
  public readonly onWillDispose: event.Event<void> = this._onWillDispose.event;

  private readonly _onDidChangeContent: event.Emitter<void> = this._register(
    new event.Emitter<void>()
  );
  public readonly onDidChangeContent: event.Event<void> =
    this._onDidChangeContent.event;

  constructor(public readonly path: string, code: string) {
    super();
    this._javascriptCode = code;
  }

  getValue(): string {
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
