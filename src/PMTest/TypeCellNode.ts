import { Node } from '@tiptap/core'
import { Command, mergeAttributes, ReactNodeViewRenderer } from '@tiptap/react'
import Component from './TypeCellComponent'
import { wrappingInputRule } from 'prosemirror-inputrules'

export const inputRegex = /^\s*q\s$/gm

declare module '@tiptap/core' {
    interface Commands {
      test: {
        /**
         * Toggle a paragraph
         */
        test: () => Command,
      }
    }
  }

export default Node.create({
    // configuration …
   name: "typecell",
   group: 'block',
//    content: 'block*',
   defining: true,
//    content: 'inline*',
  atom: true,
    addNodeView() {
      return ReactNodeViewRenderer(Component)
    },

    addCommands() {
        return {
          test: () => ({ commands }) => {
            return commands.insertNode('typecell')
          },
        }
      },

    addKeyboardShortcuts() {
        return {
            "m": () => this.editor.chain().insertNode('typecell', []).run()
        };
        
    },
    parseHTML() {
        return [
          {
            tag: 'react-component',
          },
        ]
      },
      renderHTML({ HTMLAttributes }) {
        return ['react-component', mergeAttributes(HTMLAttributes)]
      },
    // addInputRules() {
    //     return [
    //       wrappingInputRule(inputRegex, this.type)
    //     ]
    //   },
  })