import Link from "@tiptap/extension-link";
import { Plugin, PluginKey }  from 'prosemirror-state'

export const pasteRegexExact = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}\b(?:[-a-zA-Z0-9@:%._+~#=?!&/]*)(?:[-a-zA-Z0-9@:%._+~#=?!&/]*)$/gi

/**
 * This extends the default link mark
 * 
 * The two plugins are taken from the link mark library, with its name changed.
 * The default option for handleOnClick is disabled in RichTextRenderer, 
 * and this one is to be used instead to be able to extend the behaviour.
 */
export const CustomLink = Link.extend({
    addProseMirrorPlugins() {
    const plugins = []

    plugins.push(
      new Plugin({
          key: new PluginKey('handleClickLink'),
          props: {
          handleClick: (view, pos, event) => {
              const attrs = this.editor.getAttributes('link')
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

    // To create a new plugin, add it to plugins list. See default link mark.


    return plugins
    },
})