import { Block, BlockNoteEditor } from "@blocknote/core";

import {
  ObservableMap,
  action,
  makeObservable,
  observable,
  onBecomeObserved,
  runInAction,
} from "mobx";
import { TypeCellBlock } from "./TypeCellCodeBlock";
import LocalExecutionHost from "./runtime/executor/executionHosts/local/LocalExecutionHost";

export class EditorStore {
  private readonly blockCache = new ObservableMap<string, TypeCellBlock>();

  // TODO: hacky properties
  /** @internal */
  public editor: BlockNoteEditor | undefined;
  /** @internal */
  public executionHost: LocalExecutionHost | undefined;
  public topLevelBlocks: any;

  public readonly customBlocks = new Map<string, any>();
  public readonly blockSettings = new Map<string, any>();

  constructor() {
    makeObservable(this, {
      customBlocks: observable.shallow,
      addCustomBlock: action,
      deleteCustomBlock: action,
      blockSettings: observable.shallow,
      addBlockSettings: action,
      deleteBlockSettings: action,
      topLevelBlocks: observable.ref,
    });

    onBecomeObserved(this, "topLevelBlocks", () => {
      this.editor!.onEditorContentChange(() => {
        runInAction(() => {
          this.topLevelBlocks = this.editor!.topLevelBlocks.map((block) =>
            this.getBlock(block.id),
          );
        });
      });
      this.topLevelBlocks = this.editor!.topLevelBlocks.map((block) =>
        this.getBlock(block.id),
      );
    });
  }

  /**
   * Add a custom block (slash menu command) to the editor
   */
  public addCustomBlock(config: any) {
    if (this.customBlocks.has(config.id)) {
      // already has block with this id, maybe loop of documents?
      return;
    }
    this.customBlocks.set(config.id, config);
  }

  /**
   * Remove a custom block (slash menu command) from the editor
   */
  public deleteCustomBlock(config: any) {
    this.customBlocks.delete(config.id);
  }

  /**
   * Add a block settings (block settings menu) to the editor
   */
  public addBlockSettings(config: any) {
    if (this.blockSettings.has(config.id)) {
      // already has block with this id, maybe loop of documents?
      return;
    }
    this.blockSettings.set(config.id, config);
  }

  /**
   * Remove block settings (block settings menu) from the editor
   */
  public deleteBlockSettings(config: any) {
    this.blockSettings.delete(config.id);
  }

  /**
   * EXPERIMENTAL
   * @internal
   * */
  public getBlock(id: string) {
    let block = this.blockCache.get(id);
    if (!block) {
      const editorBlock = this.editor!.getBlock(id);
      if (!editorBlock) {
        return undefined;
      }

      block = new TypeCellBlock(id, this.editor!, this.executionHost!, () => {
        this.blockCache.delete(id);
      });
      this.blockCache.set(id, block);
    }

    const b = block;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    return {
      ...block.block,
      storage: block.storage,
      get parent(): any {
        const findParent = (
          searchId: string,
          parentId: string | undefined,
          children: Block[],
        ): string | undefined => {
          for (const child of children) {
            if (child.id === searchId) {
              return parentId;
            }
            const found = findParent(searchId, child.id, child.children);
            if (found) {
              return found;
            }
          }
          return undefined;
        };
        const parentId = findParent(id, undefined, that.editor!.topLevelBlocks);
        if (!parentId) {
          return undefined;
        }
        return that.getBlock(parentId);
      },
      get context() {
        return b.context;
      },
    };
  }

  /**
   * EXPERIMENTAL
   *
   * @internal
   * */
  public get firstBlock() {
    return this.getBlock(this.editor!.topLevelBlocks[0].id);
  }
}
