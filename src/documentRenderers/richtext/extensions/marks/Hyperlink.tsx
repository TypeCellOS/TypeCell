import Tippy from "@tippyjs/react";
import { getMarkRange } from "@tiptap/core";
import { Link } from "@tiptap/extension-link";
import { Plugin, PluginKey } from "prosemirror-state";
import { ResolvedPos, Mark } from "prosemirror-model";
import ReactDOM from "react-dom";
import { HyperlinkBasicMenu } from "./hyperlinkMenus/HyperlinkBasicMenu";
import {
  HyperlinkEditMenu,
  HyperlinkEditorMenuProps,
} from "./hyperlinkMenus/HyperlinkEditMenu";

/**
 * a helper function that wraps a Tippy around a HyperlinkEditMenu
 * @param anchorPos an Pos object from generateAnchorPos
 * @param anchor the anchor element
 * @param editHandler the handler for submission
 * @returns a Tippy that shows when the Edit Link button is clicked
 */
const tippyWrapperHyperlinkEditMenu = (
  props: HyperlinkEditorMenuProps & { anchorPos: ClientRect | DOMRect }
) => {
  const { anchorPos, ...editMenuProps } = props;
  return (
    <Tippy
      getReferenceClientRect={() => anchorPos}
      content={<HyperlinkEditMenu {...editMenuProps}></HyperlinkEditMenu>}
      interactive={true}
      interactiveBorder={30}
      showOnCreate={true}
      trigger={"click"} // so that we don't hide on mouse out
      hideOnClick
      appendTo={document.body}>
      <div></div>
    </Tippy>
  );
};

/**
 * This customed link includes a special menu for editing/deleting/opening the link.
 * The menu will be triggered by hovering over the link with the mouse,
 * or by moving the cursor inside the link text
 */
const Hyperlink = Link.extend({
  priority: 500,
  addProseMirrorPlugins() {
    return [...(this.parent?.() || []), linkMenusPlugin()];
  },
});

const PLUGIN_KEY = new PluginKey("linkMenus");

function linkMenusPlugin() {
  // as we always use Tippy appendTo(document.body), we can just create an element
  // that we use for ReactDOM, but it isn't used anywhere (except by React internally)
  const fakeRenderTarget = document.createElement("div");

  let hoveredLink: HTMLAnchorElement | undefined;
  let menuState: "cursor-based" | "mouse-based" | "hidden" = "hidden";
  let nextTippyKey = 0;

  return new Plugin({
    key: PLUGIN_KEY,
    view() {
      return {
        update: async (view, prevState) => {
          const selection = view.state.selection;
          if (selection.from !== selection.to) {
            // don't show menu when we have an active selection
            if (menuState !== "hidden") {
              menuState = "hidden";
              ReactDOM.render(<></>, fakeRenderTarget);
            }
            return;
          }

          let pos: number | undefined;
          let resPos: ResolvedPos<any> | undefined;
          let linkMark: Mark<any> | undefined;
          let basedOnCursorPos = false;
          if (hoveredLink) {
            pos = view.posAtDOM(hoveredLink.firstChild!, 0);
            resPos = view.state.doc.resolve(pos);
            // based on https://github.com/ueberdosis/tiptap/blob/main/packages/core/src/helpers/getMarkRange.ts
            const start = resPos.parent.childAfter(resPos.parentOffset).node;
            linkMark = start?.marks.find((m) => m.type.name.startsWith("link"));
          }

          if (
            !linkMark &&
            (view.hasFocus() || menuState === "cursor-based") // prevents re-opening menu after submission. Only open cursor-based menu if editor has focus
          ) {
            // no hovered link mark, try get from cursor position
            pos = selection.from;
            resPos = view.state.doc.resolve(pos);
            const start = resPos.parent.childAfter(resPos.parentOffset).node;
            linkMark = start?.marks.find((m) => m.type.name.startsWith("link"));
            basedOnCursorPos = true;
          }

          if (!linkMark || !pos || !resPos) {
            // The mouse-based popup takes care of hiding itself (tippy)
            // Because the cursor-based popup is has "showOnCreate", we want to hide it manually
            // if the cursor moves way
            if (menuState === "cursor-based") {
              menuState = "hidden";
              ReactDOM.render(<></>, fakeRenderTarget);
            }
            return;
          }

          const range = getMarkRange(resPos, linkMark.type, linkMark.attrs)!;
          const text = view.state.doc.textBetween(range.from, range.to);
          const url = linkMark.attrs.href;

          const anchorPos = {
            ...view.coordsAtPos(range.from),
            height: 0, // needed to satisfy types
            width: 0,
          };

          const foundLinkMark = linkMark; // typescript workaround for event handlers

          // Delete mark first, then replace the text, mark that piece of text with the new link
          const editHandler = (href: string, text: string) => {
            menuState = "hidden";
            ReactDOM.render(<></>, fakeRenderTarget);

            foundLinkMark.attrs = { ...foundLinkMark.attrs, href };
            const tr = view.state.tr.insertText(text, range.from, range.to);
            tr.addMark(range.from, range.from + text.length, foundLinkMark);
            view.dispatch(tr);
          };

          const removeHandler = () => {
            view.dispatch(
              view.state.tr.removeMark(range.from, range.to, foundLinkMark.type)
            );
          };

          const hyperlinkEditMenu = tippyWrapperHyperlinkEditMenu({
            anchorPos,
            text,
            url,
            onSubmit: editHandler,
          });

          const hyperlinkBasicMenu = (
            <Tippy
              key={nextTippyKey + ""} // it could be tippy has "hidden" itself after mouseout. We use a key to get a new instance with a clean state.
              getReferenceClientRect={() => anchorPos}
              content={
                <HyperlinkBasicMenu
                  editMenu={hyperlinkEditMenu}
                  removeHandler={removeHandler}
                  href={url}></HyperlinkBasicMenu>
              }
              onHide={() => {
                nextTippyKey++;
                menuState = "hidden";
              }}
              aria={{ expanded: false }}
              interactive={true}
              interactiveBorder={30}
              triggerTarget={hoveredLink}
              showOnCreate={basedOnCursorPos}
              appendTo={document.body}>
              <div></div>
            </Tippy>
          );
          ReactDOM.render(hyperlinkBasicMenu, fakeRenderTarget);
          menuState = basedOnCursorPos ? "cursor-based" : "mouse-based";
        },
      };
    },

    props: {
      handleDOMEvents: {
        mouseover(view, event) {
          const newHoveredLink =
            event.target instanceof HTMLAnchorElement &&
            event.target.nodeName === "A"
              ? event.target
              : undefined;

          if (newHoveredLink !== hoveredLink) {
            // dispatch a meta transaction to make sure the view gets updated
            hoveredLink = newHoveredLink;

            view.dispatch(
              view.state.tr.setMeta(PLUGIN_KEY, { hoveredLinkChanged: true })
            );
          }
          return false;
        },
      },
    },
  });
}

export default Hyperlink;
