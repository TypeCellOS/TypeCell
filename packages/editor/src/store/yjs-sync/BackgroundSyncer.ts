/*
export class BackgroundSyncer extends lifecycle.Disposable {
  private loadedDocuments = new Map<string, LocalDoc>();

  constructor(private readonly coordinator: DocumentCoordinator) {
    super();
    autorun(() => {
      coordinator.documents.forEach((docInfo, docId) => {});
    });
  }

  public async initialize() {
    await this.indexedDBProvider.whenSynced;
  }
}*/
