import Link from "@tiptap/extension-link";
import { Plugin, PluginKey }  from 'prosemirror-state'

export const pasteRegexExact = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}\b(?:[-a-zA-Z0-9@:%._+~#=?!&/]*)(?:[-a-zA-Z0-9@:%._+~#=?!&/]*)$/gi

export const CustomLink = Link.extend({
    addProseMirrorPlugins() {
    const plugins = []

    plugins.push(
    new Plugin({
        key: new PluginKey('handleClickLink'),
        props: {
        handleClick: (view, pos, event) => {
            const attrs = this.editor.getAttributes('link')
            console.log("event is, ", event.type);
            console.log("detail is, ", event.detail);
            const link = (event.target as HTMLElement)?.closest('a')

            if (link && attrs.href) {
            window.open(attrs.href, attrs.target)

            return true
            }

            return false
        },
        },
    }),
    )

    if (this.options.linkOnPaste) {
      plugins.push(
        new Plugin({
          key: new PluginKey('handlePasteLink'),
          props: {
            handlePaste: (view, event, slice) => {
              const { state } = view
              const { selection } = state
              const { empty } = selection

              if (empty) {
                return false
              }

              let textContent = ''

              slice.content.forEach(node => {
                textContent += node.textContent
              })

              if (!textContent || !textContent.match(pasteRegexExact)) {
                return false
              }

              this.editor.commands.setMark(this.type, {
                href: textContent,
              })

              return true
            },
          },
        }),
      )
    }

    return plugins
    },
})