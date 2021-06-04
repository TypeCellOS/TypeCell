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

// ids to search for the active anchor link and its menu
const ACTIVE = "activeLink";
const HYPERLINKMENU = "hyperlinkMenu";

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
  return (
    <div className={`${styles.linkerWrapper} ${menuStyles.bubbleMenu}`}>
      <Tippy
        content={
          <HyperlinkEditor
            pre={props.href}
            editHandler={props.editHandler}></HyperlinkEditor>
        }
        trigger="click"
        interactive={true}>
        <Button
          appearance="subtle"
          iconBefore={<Edit className={menuStyles.icon}></Edit>}></Button>
      </Tippy>

      <Button
        appearance="subtle"
        onClick={props.removeHandler}
        iconBefore={<Remove className={menuStyles.icon}></Remove>}></Button>

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
    </div>
  );
};

type HyperlinkEditorProps = {
  pre: string;
  editHandler: (href: string) => void;
};

/**
 * The sub menu for editing an anchor element
 * @param props props of menu for editing
 * @returns a menu for the edit operation of a hyperlink
 */
const HyperlinkEditor = (props: HyperlinkEditorProps) => {
  return (
    <div className={styles.editingWrapper}>
      <input
        type="text"
        defaultValue={props.pre}
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

const Hyperlink = Link.extend({
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("customLinkMark"),
        props: {
          handleDOMEvents: {
            mouseover: (view, event) => {
              const anchor = event.target;

              // this only handles an <a> element
              if (
                anchor &&
                anchor instanceof Element &&
                anchor.nodeName === "A"
              ) {
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
                    triggerTarget={document.getElementById(ACTIVE)}
                    appendTo={() => document.body}>
                    <div>&nbsp;</div>
                  </Tippy>
                );

                ReactDOM.render(
                  hyperlinkMenu,
                  document.getElementById(HYPERLINKMENU)
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
