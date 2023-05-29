import { CodeModel } from "@typecell-org/engine";
import type * as monaco from "monaco-editor";
import { event, lifecycle } from "vscode-lib";

export abstract class TypeCellCodeModel
  extends lifecycle.Disposable
  implements CodeModel
{
  // TODO: what if language changes?
  constructor(public readonly path: string, public readonly language: string) {
    super();
  }

  public abstract getValue(): string;

  protected readonly _onWillDispose: event.Emitter<void> = this._register(
    new event.Emitter<void>()
  );
  public readonly onWillDispose: event.Event<void> = this._onWillDispose.event;

  protected readonly _onDidChangeContent: event.Emitter<void> = this._register(
    new event.Emitter<void>()
  );
  public readonly onDidChangeContent: event.Event<void> =
    this._onDidChangeContent.event;

  public abstract acquireMonacoModel(): monaco.editor.ITextModel;

  public abstract releaseMonacoModel(): void;

  public dispose() {
    this._onWillDispose.fire();
    super.dispose();
  }
}
