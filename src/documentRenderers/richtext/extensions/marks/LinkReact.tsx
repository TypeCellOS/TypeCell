import ReactDOM from "react-dom";
import { Link } from "@tiptap/extension-link";
import { Plugin, PluginKey } from "prosemirror-state";
import Tippy from "@tippyjs/react";
import styles from "./Link.module.css";
import menuStyles from "../../menus/InlineMenu.module.css";

/**
 * delete the hyperlink hover menu
 */
const clearLinker = () => {
  const menu = document.getElementById("linker");
  if (menu) menu.remove();
};

type HyperlinkMenuProps = {
  removeHandler: () => void;
  href: string;
  editHandler: (href: string) => void;
};

/**
 * This is the React equivalent of the native API version in ./Link.tsx
 * @param props props of Floater
 * @returns a menu for editing/removing/opening the link
 */
const Floater = (props: HyperlinkMenuProps) => {
  return (
    <div
      id={"linker"}
      className={`${styles.linkerWrapper} ${menuStyles.bubbleMenu}`}>
      <Tippy
        content={
          <HyperlinkEditor
            pre={props.href}
            editHandler={props.editHandler}></HyperlinkEditor>
        }
        interactive={true}>
        <div className={styles.operationButton}>edit</div>
      </Tippy>
      <div className={styles.operationButton} onClick={props.removeHandler}>
        <a
          href={"//" + props.href}
          className={styles.open}
          target="_blank"
          rel="noreferrer">
          open
        </a>
      </div>
      <div className={styles.operationButton}>open</div>
    </div>
  );
};

type HyperlinkEditorProps = {
  editHandler: (href: string) => void;
  pre: string;
};
/**
 * This is the React equivalent of generateTippyEditor in ./Link.tsx
 * @param props props of menu for editing
 * @returns a menu for edit operation of a hyperlink
 */
const HyperlinkEditor = (props: HyperlinkEditorProps) => {
  return (
    <div className={styles.editingWrapper}>
      <input type="text" value={props.pre} className={styles.input}></input>
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
            clearLinker();
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
          handleClick: (view, pos, event) => {
            clearLinker();
            document.querySelectorAll(".activeLink").forEach((link) => {
              link.classList.remove("activeLink");
            });
            return true;
          },
          handleDOMEvents: {
            mouseover: (view, event) => {
              const anchor = event.target;
              if (
                anchor &&
                anchor instanceof Element &&
                anchor.nodeName === "A"
              ) {
                clearLinker();
                anchor.classList.add("activeLink");

                // setting selection of the PM editor to that anchor link
                const from = 1 + view.posAtDOM(anchor, -1);
                const to = from; // + anchor.innerHTML.length;
                this.editor
                  .chain()
                  .focus()
                  .setTextSelection({ from, to })
                  .run();

                const removeHandler = () => {
                  this.editor.chain().focus().unsetLink().run();
                  clearLinker();
                };
                const editHandler = (href: string) => {
                  this.editor.chain().focus().setLink({ href }).run();
                };

                const href = this.editor
                  .getAttributes("link")
                  ?.href.substring(2);
                const menu = (
                  <Floater
                    removeHandler={removeHandler}
                    editHandler={editHandler}
                    href={href}></Floater>
                );

                // Using ReactDOM.render to render another Tippy element
                // BUT, this is rendered after the prosemirror editor div element
                // The position of Tippy is now the <div>, NOT the location of anchor element
                const TippyAppended = (
                  <Tippy
                    content={menu}
                    triggerTarget={document.querySelector(".activeLink")}>
                    <div></div>
                  </Tippy>
                );
                const prosemirror = document.querySelector(
                  ".ProseMirror.editor"
                );

                if (!prosemirror?.nextElementSibling) {
                  // Add an invisible element to render Tippy Component
                  const div = document.createElement("div");
                  div.id = "hyperlinkMenu";
                  prosemirror?.parentElement?.appendChild(div);
                }
                const hyperlinkMenu = prosemirror?.nextElementSibling;
                if (hyperlinkMenu) {
                  ReactDOM.render(TippyAppended, hyperlinkMenu);
                }

                return true;
              }
              return false;
            },
          },
        },
      }),
    ];
  },
});

export default Hyperlink;
