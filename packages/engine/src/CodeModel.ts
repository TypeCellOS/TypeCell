type Event<T> = {
  (listener: (e: T) => any): { dispose: () => void };
};

export type CodeModel = {
  onWillDispose: Event<void>;
  onDidChangeContent: Event<void>;
  getValue(): string;
  readonly path: string;
  readonly language: string;
};
