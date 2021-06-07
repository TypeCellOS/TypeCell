import ReactDOM from "react-dom";
import { Link } from "@tiptap/extension-link";
import { Plugin, PluginKey } from "prosemirror-state";
import Button from "@atlaskit/button";
import Tippy from "@tippyjs/react";
import styles from "./Hyperlink.module.css";
import menuStyles from "../../menus/InlineMenu.module.css";
import Edit from "remixicon-react/EditBoxLineIcon";
import Remove from "remixicon-react/CloseLineIcon";
import Open from "remixicon-react/ShareBoxLineIcon";
import React from "react";

// ids to search for the active anchor link and its menu
const ACTIVE = "activeLink";
const HYPERLINK_MENU = "hyperlinkMenu";
const EDITING_MENU = "editingHyperlinkMenu";
const KEYBORAD_MENU = "keyboardTriggeredMenu";
const MOUSE_MENU = "mousehoverTriggeredMenu";

const EMPTY_MENU = <div></div>;

type HyperlinkMenuProps = {
  href: string;
  removeHandler: () => void;
  editHandler: (href: string) => void;
};

/**
 * A hyperlink menu shown when an anchor is hovered over.
 * @param props props of a hyperlink menu
 * @returns a menu for editing/removing/opening the link
 */
const HyperLinkMenu = (props: HyperlinkMenuProps) => {
  const [value, setValue] = React.useState(props.href);

  React.useEffect(() => {
    const anchor = document.getElementById(ACTIVE);
    if (anchor) {
      const href = anchor.getAttribute("href");
      if (href) setValue(href.substring(2));
    }
  }, [props.href]);

  return (
    <div className={`${styles.linkerWrapper} ${menuStyles.bubbleMenu}`}>
      <Tippy
        content={
          <div className={menuStyles.buttonTooltip}>
            <div className={menuStyles.mainText}>Edit</div>
          </div>
        }>
        <Tippy
          content={
            <HyperlinkEditor
              pre={value}
              setter={setValue}
              editHandler={props.editHandler}></HyperlinkEditor>
          }
          trigger="click"
          interactive={true}
          interactiveBorder={30}>
          <Button
            appearance="subtle"
            iconBefore={<Edit className={menuStyles.icon}></Edit>}></Button>
        </Tippy>
      </Tippy>

      <Tippy
        content={
          <div className={menuStyles.buttonTooltip}>
            <div className={menuStyles.mainText}>Remove</div>
          </div>
        }>
        <Button
          appearance="subtle"
          onClick={props.removeHandler}
          iconBefore={<Remove className={menuStyles.icon}></Remove>}></Button>
      </Tippy>

      <Tippy
        content={
          <div className={menuStyles.buttonTooltip}>
            <div className={menuStyles.mainText}>Open</div>
          </div>
        }>
        <Button
          appearance="subtle"
          iconBefore={
            <a
              href={"//" + props.href}
              className={styles.open}
              target="_blank"
              rel="noreferrer">
              <Open className={menuStyles.icon}></Open>
            </a>
          }></Button>
      </Tippy>
    </div>
  );
};

type HyperlinkEditorProps = {
  pre: string;
  editHandler: (href: string) => void;
  setter: (href: string) => void;
};

/**
 * The sub menu for editing an anchor element
 * @param props props of menu for editing
 * @returns a menu for the edit operation of a hyperlink
 */
const HyperlinkEditor = (props: HyperlinkEditorProps) => {
  return (
    <div
      className={`${styles.editingWrapper} ${menuStyles.bubbleMenu}`}
      id={EDITING_MENU}>
      <input
        type="text"
        value={props.pre}
        onChange={(ev) => props.setter(ev.target.value)}
        className={styles.input}></input>
      <button
        type="submit"
        className={styles.ok}
        onClick={(ev) => {
          ev.preventDefault();
          const target = ev.target;
          if (target instanceof HTMLElement) {
            const val = target.previousElementSibling;
            if (val instanceof HTMLInputElement) {
              const value = val.value;
              props.editHandler("//" + value);
            }
          }
        }}>
        OK
      </button>
    </div>
  );
};

/**
 * Used to clear the previous tippy menu.
 */
const clearMenu = () => {
  ReactDOM.render(EMPTY_MENU, document.getElementById(HYPERLINK_MENU));
};

const Hyperlink = Link.extend({
  priority: 500,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("customLinkMark"),
        props: {
          handleClick: (view, event) => {
            if (document.getElementById(KEYBORAD_MENU)) {
              clearMenu();
            }
            return false;
          },
          handleDOMEvents: {
            keyup: (view, event) => {
              const key = event.key;
              // only when using arrow keys
              if (key.toLowerCase().startsWith("arrow")) {
                const selection = view.state.selection;
                // when there is no selection
                if (selection.from === selection.to) {
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
                      from = resPos.pos;
                      console.log(`pos is ${pos} and respos is ${resPos.pos}`);
                      const domNode = view.domAtPos(from, 1);
                      console.log(`the offset is ${domNode.offset}`);
                      const parent = domNode.node.parentElement;
                      from -= domNode.offset;
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
                  if (document.getElementById(MOUSE_MENU)) {
                    clearMenu();
                  }

                  // if there is no Link mark adjacent to selection
                  if (!exist) {
                    // caret is changed, so the previous keyboard menu must be deleted
                    if (document.getElementById(KEYBORAD_MENU)) {
                      clearMenu();
                    }
                    return false;
                  }

                  // @ts-ignore
                  if (anchor) {
                    if (document.getElementById(KEYBORAD_MENU)) {
                      // if (ACTIVE === anchor.id) {
                      //   // when the keyboard menu <div> is present
                      //   // and the active link is the same as last one
                      //   // do not render again
                      //   return false;
                      // }
                      clearMenu();
                    }

                    document.getElementById(ACTIVE)?.removeAttribute("id");
                    anchor.id = ACTIVE;

                    const removeHandler = () => {
                      this.editor.chain().unsetLink().run();
                    };
                    const editHandler = (href: string) => {
                      marks.forEach((mark) => {
                        if (mark.type.name.startsWith("link")) {
                          this.editor.chain().unsetLink().run();
                          mark.attrs = { ...mark.attrs, href };
                          view.dispatch(view.state.tr.addMark(from, to, mark));
                        }
                      });
                    };

                    // this rect position is used for Tippy as reference
                    const rect = anchor.getBoundingClientRect();
                    const anchorPos = {
                      height: rect.height,
                      width: rect.width,
                      left: rect.left,
                      right: rect.right,
                      top: rect.top,
                      bottom: rect.bottom,
                    };

                    const hyperlinkMenu = (
                      <Tippy
                        getReferenceClientRect={() => anchorPos}
                        content={
                          <HyperLinkMenu
                            removeHandler={removeHandler}
                            editHandler={editHandler}
                            href={href ?? ""}></HyperLinkMenu>
                        }
                        interactive={true}
                        interactiveBorder={30}
                        showOnCreate={true}
                        // the trigger is no longer mouse enter
                        trigger={`keyup keydown`}
                        onTrigger={(instance, event) => {
                          if (event instanceof KeyboardEvent) {
                            if (event.key.startsWith("arrow")) {
                              instance.show();
                            }
                            instance.hide();
                          }
                          instance.hide();
                        }}
                        triggerTarget={document.getElementById(ACTIVE)}
                        appendTo={() => document.body}>
                        <div id={KEYBORAD_MENU}></div>
                      </Tippy>
                    );

                    ReactDOM.render(
                      hyperlinkMenu,
                      document.getElementById(HYPERLINK_MENU)
                    );
                    return true;
                  }
                  return false;
                }
                return false;
              }
              return false;
            },
            mouseover: (view, event) => {
              const anchor = event.target;
              // this only handles an <a> element
              if (
                anchor &&
                anchor instanceof Element &&
                anchor.nodeName === "A" &&
                !document.getElementById(EDITING_MENU)
              ) {
                if (document.getElementById(MOUSE_MENU)) clearMenu();
                document.getElementById(ACTIVE)?.removeAttribute("id");
                anchor.id = ACTIVE;
                const href = anchor.getAttribute("href")?.substring(2);

                // find the position of this <a> and construct handlers accordingly
                const from = view.posAtDOM(anchor, -1);
                const to = from + anchor.innerHTML.length;
                const resPos = view.state.doc.resolve(from + 1);
                const marks = resPos.marks();
                const removeHandler = () => {
                  marks.forEach((mark) => {
                    if (mark.type.name.startsWith("link")) {
                      mark.attrs = { ...mark.attrs, href };
                      view.dispatch(view.state.tr.removeMark(from, to, mark));
                    }
                  });
                };
                const editHandler = (href: string) => {
                  marks.forEach((mark) => {
                    if (mark.type.name.startsWith("link")) {
                      view.dispatch(view.state.tr.removeMark(from, to, mark));
                      mark.attrs = { ...mark.attrs, href };
                      view.dispatch(view.state.tr.addMark(from, to, mark));
                    }
                  });
                };

                // this rect position is used for Tippy as reference
                const rect = anchor.getBoundingClientRect();
                const anchorPos = {
                  height: rect.height,
                  width: rect.width,
                  left: rect.left,
                  right: rect.right,
                  top: rect.top,
                  bottom: rect.bottom,
                };

                const hyperlinkMenu = (
                  <Tippy
                    getReferenceClientRect={() => anchorPos}
                    content={
                      <HyperLinkMenu
                        removeHandler={removeHandler}
                        editHandler={editHandler}
                        href={href ?? ""}></HyperLinkMenu>
                    }
                    interactive={true}
                    interactiveBorder={30}
                    triggerTarget={document.getElementById(ACTIVE)}
                    appendTo={() => document.body}>
                    <div id={MOUSE_MENU}></div>
                  </Tippy>
                );

                ReactDOM.render(
                  hyperlinkMenu,
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
