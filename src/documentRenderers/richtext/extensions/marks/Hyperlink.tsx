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
import PanelTextInput from "./AtlaskitHyperlink/PanelTextInput";
import {
  Container,
  ContainerWrapper,
  IconWrapper,
  TextInputWrapper,
  UrlInputWrapper,
} from "./AtlaskitHyperlink/ToolbarComponent";
import Tooltip from "@atlaskit/tooltip";
import LinkIcon from "@atlaskit/icon/glyph/link";
import EditorAlignLeftIcon from "@atlaskit/icon/glyph/editor/align-left";

// ids to search for the active anchor link and its menu
const ACTIVE = "activeLink";
export const HYPERLINK_MENU = "hyperlinkMenu";
const EDITING_MENU = "editingHyperlinkMenu";
const EDITING_MENU_LINK = EDITING_MENU + "Link";
const EDITING_MENU_TEXT = EDITING_MENU + "Text";
const MENU = "hyperlinkMenuDiv";

const EMPTY_MENU = <div></div>;

type HyperlinkMenuProps = {
  href: string;
  text: string;
  removeHandler: () => void;
  editHandler: (href: string, text: string) => void;
};

/**
 * A hyperlink menu shown when an anchor is hovered over.
 * @param props props of a hyperlink menu
 * @returns a menu for editing/removing/opening the link
 */
const HyperLinkMenu = (props: HyperlinkMenuProps) => {
  const [value, setValue] = React.useState([props.href, props.text]);

  React.useEffect(() => {
    const anchor = document.getElementById(ACTIVE);
    if (anchor) {
      const href = anchor.getAttribute("href");
      if (href) setValue([href.substring(2), anchor.innerText]);
    }
  }, [props.href, props.text]);

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
            <HyperlinkEditorAtlaskit
              previousLink={value[0]}
              previousText={value[1]}
              setter={setValue}
              editHandler={props.editHandler}></HyperlinkEditorAtlaskit>
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
  previousLink: string;
  previousText: string;
  editHandler: (href: string, text: string) => void;
  setter: (arr: [href: string, text: string]) => void;
};

/**
 * the function that handles the input submit event
 * @param props the props from a hyperlink editor menu
 */
const submit = (props: HyperlinkEditorProps) => {
  const hyperlink = document.getElementById(EDITING_MENU_LINK);
  const title = document.getElementById(EDITING_MENU_TEXT);
  if (
    hyperlink &&
    title &&
    hyperlink instanceof HTMLInputElement &&
    title instanceof HTMLInputElement
  ) {
    const link = hyperlink.value;
    const text = title.value;
    props.editHandler("//" + link, text);
  }
};

/**
 * The sub menu for editing an anchor element
 * @param props props of menu for editing
 * @returns a menu for the edit operation of a hyperlink
 */
const HyperlinkEditorAtlaskit = (props: HyperlinkEditorProps) => {
  return (
    <ContainerWrapper>
      <Container provider={false} id={EDITING_MENU}>
        <UrlInputWrapper>
          <IconWrapper>
            <Tooltip content={"tooltip"}>
              <LinkIcon label={"link icon"}></LinkIcon>
            </Tooltip>
          </IconWrapper>
          <PanelTextInput
            id={EDITING_MENU_LINK}
            defaultValue={props.previousLink}
            onSubmit={(linkValue) => {
              submit(props);
            }}
            onChange={(value) => {
              const title = document.getElementById(EDITING_MENU_TEXT);
              if (title && title instanceof HTMLInputElement) {
                props.setter([value, title.value]);
              }
            }}></PanelTextInput>
        </UrlInputWrapper>
        <TextInputWrapper>
          <IconWrapper>
            <Tooltip content={"tooltip"}>
              <EditorAlignLeftIcon label={"title icon"}></EditorAlignLeftIcon>
            </Tooltip>
          </IconWrapper>
          <PanelTextInput
            id={EDITING_MENU_TEXT}
            defaultValue={props.previousText}
            onSubmit={(textValue) => {
              submit(props);
            }}
            onChange={(value) => {
              const hyperlink = document.getElementById(EDITING_MENU_LINK);
              if (hyperlink && hyperlink instanceof HTMLInputElement) {
                props.setter([hyperlink.value, value]);
              }
            }}></PanelTextInput>
        </TextInputWrapper>
      </Container>
    </ContainerWrapper>
  );
};

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

              const hyperlinkMenu = (
                <Tippy
                  getReferenceClientRect={() => anchorPos}
                  content={
                    <HyperLinkMenu
                      removeHandler={removeHandler}
                      editHandler={editHandler}
                      href={href ?? ""}
                      text={anchor.innerText}></HyperLinkMenu>
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
                  <div id={MENU}></div>
                </Tippy>
              );

              ReactDOM.render(
                hyperlinkMenu,
                document.getElementById(HYPERLINK_MENU)
              );
              return true;
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

                const hyperlinkMenu = (
                  <Tippy
                    getReferenceClientRect={() => anchorPos}
                    content={
                      <HyperLinkMenu
                        removeHandler={removeHandler}
                        editHandler={editHandler}
                        href={href ?? ""}
                        text={anchor.innerHTML}></HyperLinkMenu>
                    }
                    interactive={true}
                    interactiveBorder={30}
                    triggerTarget={document.getElementById(ACTIVE)}
                    appendTo={() => document.body}>
                    <div id={MENU}></div>
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
