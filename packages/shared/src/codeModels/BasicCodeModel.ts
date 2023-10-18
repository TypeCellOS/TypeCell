import { event, lifecycle, uri } from "vscode-lib";

export class BasicCodeModel extends lifecycle.Disposable {
  private readonly _onWillDispose: event.Emitter<void> = this._register(
    new event.Emitter<void>(),
  );
  public readonly onWillDispose: event.Event<void> = this._onWillDispose.event;

  private readonly _onDidChangeContent: event.Emitter<void> = this._register(
    new event.Emitter<void>(),
  );
  public readonly onDidChangeContent: event.Event<void> =
    this._onDidChangeContent.event;

  constructor(
    public readonly path: string,
    private code: string,
    public readonly language: string,
  ) {
    super();
  }

  getValue(): string {
    return this.code;
  }

  public setValue(code: string) {
    if (this.code === code) {
      return;
    }
    this.code = code;
    this._onDidChangeContent.fire();
  }

  get uri(): uri.URI {
    return uri.URI.parse(this.path);
  }

  public dispose() {
    this._onWillDispose.fire();
    super.dispose();
  }
}
