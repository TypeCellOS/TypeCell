import { Extension } from '@tiptap/core'
import { dropCursor } from "./ProseMirrorDropCursor"

export interface DropcursorOptions {
  color: string | null,
  width: number | null,
  class: string | null,
}

export const DropCursor = Extension.create<DropcursorOptions>({
  name: 'dropCursor',

  defaultOptions: {
    color: 'black',
    width: 1,
    class: null,
  },

  addProseMirrorPlugins() {
    return [
      dropCursor(this.options),
    ]
  },
})
