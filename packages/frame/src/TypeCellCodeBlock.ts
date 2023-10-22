import { Block, BlockNoteEditor } from "@blocknote/core";

import {
  computed,
  makeObservable,
  observable,
  onBecomeObserved,
  reaction,
  runInAction,
} from "mobx";
import { ExecutionHost } from "./runtime/executor/executionHosts/ExecutionHost";

/**
 * EXPERIMENTAL
 */
export class TypeCellBlock {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore it's set using updatePropertiesFromEditorBlock
  _blockNoteBlock: Block;
  storage: Record<string, any> = {};

  get id() {
    return this._blockNoteBlock.id;
  }

  get context() {
    // TODO: hacky?
    const keys = [...this.executionHost.outputs.keys()].filter((key) =>
      key.includes(this.id),
    );

    if (!keys.length) {
      return undefined;
    }

    const val = this.executionHost.outputs.get(keys[0])?.value;
    if (val instanceof Error) {
      return undefined;
    }
    return val;
  }

  constructor(
    id: string,
    editor: BlockNoteEditor,
    private readonly executionHost: ExecutionHost,
    onRemoved: () => void,
  ) {
    makeObservable(this, {
      _blockNoteBlock: observable.ref,
      context: computed,
      id: computed,
      storage: true,
    });

    const editorBlock = editor.getBlock(id);
    if (!editorBlock) {
      throw new Error("Editor block not found");
    }

    const updatePropertiesFromEditorBlock = (newBlock: Block) => {
      runInAction(() => {
        this._blockNoteBlock = newBlock;

        if ((newBlock.props as any).storage !== JSON.stringify(this.storage)) {
          if (newBlock.props as any) {
            try {
              console.log("update cell storage");
              this.storage = JSON.parse((newBlock.props as any).storage) || {};
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
            } as any,
          });
        }
      },
      { fireImmediately: false },
    );
  }
}
