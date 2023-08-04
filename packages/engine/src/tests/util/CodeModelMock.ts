import { event, uri } from "vscode-lib";
import { CodeModel } from "../../CodeModel.js";

export class CodeModelMock implements CodeModel {
  public contentChangeEmitter = new event.Emitter<void>();

  public onWillDispose() {
    return {
      dispose: () => {
        // Do nothing
      },
    };
  }
  public onDidChangeContent = this.contentChangeEmitter.event;

  constructor(
    public readonly language: string,
    public readonly path: string,
    public code: string
  ) {}

  public get uri() {
    return uri.URI.parse("file:///" + this.path);
  }

  public getValue(): string {
    return this.code;
  }

  public updateCode(code: string) {
    this.code = code;
    this.contentChangeEmitter.fire();
  }
}
