import ReactDOM from "react-dom";
import { Link } from "@tiptap/extension-link";
import { Plugin, PluginKey } from "prosemirror-state";
import Tippy from "@tippyjs/react";
import { HyperlinkBasicMenu } from "./hyperlinkMenus/HyperlinkBasicMenu";
import { HyperlinkEditMenu } from "./hyperlinkMenus/HyperlinkEditMenu";
import { Plugin as TippyPlugin } from "tippy.js";

// ids to search for the active anchor link and its menu
export const ACTIVE = "activeLink";
export const HYPERLINK_MENU = "hyperlinkMenu";
export const EDITING_MENU = "editingHyperlinkMenu";
export const EDITING_MENU_LINK = EDITING_MENU + "Link";
export const MENU = "hyperlinkMenuDiv";

export const EMPTY_MENU = <div></div>;

/**
 * Used to clear the previous tippy menu.
 */
const clearMenu = () => {
  ReactDOM.render(EMPTY_MENU, document.getElementById(HYPERLINK_MENU));
};

/**
 * A helper function that generates the position object fromm the input element
 * @param anchor the anchor element used as position target
 * @returns a position object for Tippy
 */
const generateAnchorPos = (anchor: Element) => {
  const rect = anchor.getBoundingClientRect();
  return {
    height: rect.height,
    width: rect.width,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
  };
};

/**
 * a helper function that wraps a Tippy around a HyperlinkEditMenu
 * @param anchorPos an Pos object from generateAnchorPos
 * @param anchor the anchor element
 * @param editHandler the handler for submission
 * @returns a Tippy that shows when the Edit Link button is clicked
 */
const tippyWrapperHyperlinkEditMenu = (
  anchorPos: any,
  anchor: HTMLAnchorElement,
  editHandler: (href: string, text: string) => void
) => {
  return (
    <Tippy
      getReferenceClientRect={() => anchorPos}
      content={
        <HyperlinkEditMenu
          anchor={anchor}
          editHandler={editHandler}></HyperlinkEditMenu>
      }
      interactive={true}
      interactiveBorder={30}
      triggerTarget={document.getElementById(ACTIVE)}
      appendTo={() => document.body}>
      {EMPTY_MENU}
    </Tippy>
  );
};

/**
 * Generate a Tippy plugin that hides the main menu when its sub menu is shown
 * @param hyperlinkEditMenu a HyperlinkEditMenu component
 * @returns a plugin for Tippy
 */
const hideOnClickPlugin: (hyperlinkEditMenu: JSX.Element) => TippyPlugin = (
  hyperlinkEditMenu
) => {
  return {
    name: "hideOnClick",
    defaultValue: true,
    fn(instance) {
      return {
        onCreate() {
          instance.popper.addEventListener("keyup", (ev) => {
            if (ev.key !== "Enter") return;
            if (ev.target instanceof HTMLInputElement) {
              instance.hide();
            }
          });
          instance.popper.addEventListener("click", (ev) => {
            if (ev.target instanceof HTMLElement) {
              if (
                ev.target.parentElement?.classList.contains("hyperlinkEdit")
              ) {
                ReactDOM.render(
                  hyperlinkEditMenu,
                  document.getElementById(HYPERLINK_MENU)
                );
                return;
              }
              if (ev.target instanceof HTMLInputElement) {
                return;
              }
            }
            instance.hide();
          });
        },
      };
    },
  };
};

/**
 * This customed link includes a special menu for editing/deleting/opening the link.
 * The menu will be triggered by hovering over the link with the mouse,
 * or by moving the cursor inside the link text
 */
const Hyperlink = Link.extend({
  priority: 500,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("customLinkMark"),
        props: {
          handleClick: (view, event) => {
            clearMenu();
            return false;
          },
          handleDOMEvents: {
            // keyboard trigger mechanism
            keyup: (view, event) => {
              const key = event.key;

              // only when using arrow keys
              if (!key.toLowerCase().startsWith("arrow")) {
                return false;
              }

              const selection = view.state.selection;
              // when there is no selection
              if (selection.from !== selection.to) {
                return false;
              }

              let pos = selection.from;
              const resPos = view.state.doc.resolve(pos);
              const marks = resPos.marks();
              let from = -1,
                to = -1,
                href = "";
              let anchor: HTMLElement;
              // is there any Link Mark?
              const exist = marks.some((mark) => {
                if (mark.type.name.startsWith("link")) {
                  from = pos;
                  let domNode = view.domAtPos(from, 1);

                  // must be subtracted to make sure position is correct
                  from -= domNode.offset;
                  const parent = domNode.node.parentElement;
                  if (!parent) return false;
                  anchor = parent;

                  // sometimes parent is not an <a> element
                  // but the anchor is at most its 4th order parent
                  for (let i = 0; i < 4; i++) {
                    if (anchor instanceof HTMLAnchorElement) {
                      break;
                    }
                    if (anchor.parentElement) {
                      anchor = anchor.parentElement;
                    }
                  }

                  href = mark.attrs.href;
                  to = from + anchor.innerText.length;

                  return true;
                }
                return false;
              });
              clearMenu();

              // if there is no Link mark adjacent to selection
              if (!exist) {
                return false;
              }

              // @ts-ignore
              if (!anchor) {
                return false;
              }

              if (!(anchor instanceof HTMLAnchorElement)) {
                return false;
              }

              document.getElementById(ACTIVE)?.removeAttribute("id");
              anchor.id = ACTIVE;

              const removeHandler = () => {
                this.editor.chain().unsetLink().run();
              };

              // Delete mark first, then replace the text, mark that piece of text with the new link
              const editHandler = (href: string, text: string) => {
                marks.forEach((mark) => {
                  if (mark.type.name.startsWith("link")) {
                    this.editor.chain().unsetLink().run();
                    mark.attrs = { ...mark.attrs, href };
                    view.dispatch(
                      view.state.tr
                        .insertText(text, from, to)
                        .addMark(from, from + text.length, mark)
                    );
                    to = from + text.length;
                  }
                });
              };

              // this rect position is used for Tippy as reference
              const anchorPos = generateAnchorPos(anchor);

              const hyperlinkEditMenu = tippyWrapperHyperlinkEditMenu(
                anchorPos,
                anchor,
                editHandler
              );

              const hyperlinkBasicMenu = (
                <Tippy
                  getReferenceClientRect={() => anchorPos}
                  content={
                    <HyperlinkBasicMenu
                      removeHandler={removeHandler}
                      href={href}></HyperlinkBasicMenu>
                  }
                  plugins={[hideOnClickPlugin(hyperlinkEditMenu)]}
                  interactive={true}
                  interactiveBorder={30}
                  // this is different from the mouse triggered, otherwise it won't show
                  showOnCreate={true}
                  // the trigger is no longer mouse enter
                  trigger={`keyup keydown`}
                  triggerTarget={document.getElementById(ACTIVE)}
                  appendTo={() => document.body}>
                  <div id={MENU}></div>
                </Tippy>
              );

              ReactDOM.render(
                hyperlinkBasicMenu,
                document.getElementById(HYPERLINK_MENU)
              );
              return true;
            },

            // mouse trigger mechanism
            mouseover: (view, event) => {
              const anchor = event.target;
              // this only handles an <a> element
              if (
                anchor &&
                anchor instanceof HTMLAnchorElement &&
                anchor.nodeName === "A" &&
                !document.getElementById(EDITING_MENU)
              ) {
                clearMenu();
                document.getElementById(ACTIVE)?.removeAttribute("id");
                anchor.id = ACTIVE;
                const href = anchor.getAttribute("href")?.substring(2);

                // find the position of this <a> and construct handlers accordingly
                const from = view.posAtDOM(anchor, -1);
                let to = from + anchor.innerHTML.length;
                const resPos = view.state.doc.resolve(from + 1);
                const marks = resPos.marks();
                const removeHandler = () => {
                  marks.forEach((mark) => {
                    if (mark.type.name.startsWith("link")) {
                      view.dispatch(view.state.tr.removeMark(from, to, mark));
                    }
                  });
                };
                // Delete mark first, then replace the text, mark that piece of text with the new link
                const editHandler = (href: string, text: string) => {
                  marks.forEach((mark) => {
                    if (mark.type.name.startsWith("link")) {
                      view.dispatch(view.state.tr.removeMark(from, to, mark));
                      mark.attrs = { ...mark.attrs, href };
                      view.dispatch(
                        view.state.tr
                          .insertText(text, from, to)
                          .addMark(from, from + text.length, mark)
                      );
                      to = from + text.length;
                    }
                  });
                };

                // this rect position is used for Tippy as reference
                const anchorPos = generateAnchorPos(anchor);

                const hyperlinkEditMenu = tippyWrapperHyperlinkEditMenu(
                  anchorPos,
                  anchor,
                  editHandler
                );

                const hyperlinkBasicMenu = (
                  <Tippy
                    getReferenceClientRect={() => anchorPos}
                    content={
                      <HyperlinkBasicMenu
                        removeHandler={removeHandler}
                        href={href ?? ""}></HyperlinkBasicMenu>
                    }
                    plugins={[hideOnClickPlugin(hyperlinkEditMenu)]}
                    interactive={true}
                    interactiveBorder={30}
                    triggerTarget={document.getElementById(ACTIVE)}
                    appendTo={() => document.body}>
                    <div id={MENU}></div>
                  </Tippy>
                );

                ReactDOM.render(
                  hyperlinkBasicMenu,
                  document.getElementById(HYPERLINK_MENU)
                );

                return true;
              }

              // not an <a> element, so the event is not handled
              return false;
            },
          },
        },
      }),
    ];
  },
});

export default Hyperlink;
