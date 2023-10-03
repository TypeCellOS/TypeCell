import { Block, BlockNoteEditor } from "@blocknote/core";

import {
  ObservableMap,
  action,
  makeObservable,
  observable,
  onBecomeObserved,
  reaction,
  runInAction,
} from "mobx";

export class EditorStore {
  private readonly blockCache = new ObservableMap<string, TypeCellBlock>();
  public editor: BlockNoteEditor | undefined;

  constructor() {
    makeObservable(this, {
      customBlocks: observable.shallow,
      add: action,
      delete: action,
    });
  }

  customBlocks = new Map<string, any>();

  public add(config: any) {
    if (this.customBlocks.has(config.id)) {
      // already has block with this id, maybe loop of documents?
      return;
    }
    this.customBlocks.set(config.id, config);
  }

  public delete(config: any) {
    this.customBlocks.delete(config.id);
  }

  public getBlock(id: string) {
    let block = this.blockCache.get(id);
    if (!block) {
      const editorBlock = this.editor!.getBlock(id);
      if (!editorBlock) {
        return undefined;
      }

      block = new TypeCellBlock(id, this.editor!, () => {
        this.blockCache.delete(id);
      });
      this.blockCache.set(id, block);
    }

    return {
      ...block.block,
      storage: block.storage,
    };
  }

  public get firstBlock() {
    return this.getBlock(this.editor!.topLevelBlocks[0].id);
  }
}

class TypeCellBlock {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore it's set using updatePropertiesFromEditorBlock
  block: Block;
  storage: Record<string, any> = {};

  constructor(id: string, editor: BlockNoteEditor, onRemoved: () => void) {
    makeObservable(this, {
      block: observable.ref,
      storage: true,
    });

    const editorBlock = editor.getBlock(id);
    if (!editorBlock) {
      throw new Error("Editor block not found");
    }

    const updatePropertiesFromEditorBlock = (newBlock: Block) => {
      runInAction(() => {
        this.block = newBlock;

        if (newBlock.props.storage !== JSON.stringify(this.storage)) {
          if (newBlock.props.storage) {
            try {
              console.log("update cell storage");
              this.storage = JSON.parse(newBlock.props.storage) || {};
            } catch (e) {
              console.error(e);
            }
          } else {
            this.storage = {};
          }
        }
      });
    };
    updatePropertiesFromEditorBlock(editorBlock);

    const updateBlock = () => {
      const newBlock = editor.getBlock(id);
      if (!newBlock) {
        onRemoved();
        return;
      }
      if (newBlock !== this.block) {
        updatePropertiesFromEditorBlock(newBlock);
      }
    };

    onBecomeObserved(this, "block", () => {
      editor.onEditorContentChange(() => {
        updateBlock();
      });
      updateBlock();
    });

    reaction(
      () => (this.storage ? JSON.stringify(this.storage) : undefined),
      (val) => {
        if (val) {
          editor.updateBlock(this.block, {
            props: {
              storage: val,
            },
          });
        }
      },
      { fireImmediately: false },
    );
  }
}
