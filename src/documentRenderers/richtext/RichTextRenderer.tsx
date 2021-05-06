import { observer } from "mobx-react-lite";
import React from "react";

import styles from "./RichTextRenderer.module.css";
import { DocConnection } from "../../store/DocConnection";
import RichTextEditor from "./RichTextEditor";
import RichTextConsole from "./RichTextConsole";

function getNewDoc(owner: string, document: string, serial: number) {
  const loader = DocConnection.load({
    owner: owner,
    document: `${document}#${serial}`,
  });
  loader.create("!richtext");
  return loader.doc;
}

function reduce(state: any, action: any): any {
  let newState = {};
  if (action.type) {
    console.log(`state is ${state}`);
    console.log(`action type is ${action.type} with data ${action.data}`);
    if (action.type === "add") {
      newState = {
        content: [
          ...state.content.slice(),
          <RichTextEditor
            key={`data-block-${state.globalId}`}
            // @ts-ignore
            document={getNewDoc(state.owner, state.document, state.globalId)}
            id={`data-block-${state.globalId}`}
            dispatcher={action.dispatcher}></RichTextEditor>,
        ],
        document: state.document,
        globalId: state.globalId + 1,
        owner: state.owner,
      };
    } else if (action.type === "delete") {
      // @ts-ignore
      const newChildren = state.content.filter((e) => {
        console.log(e);
        if (action.data === e.key) {
          return false;
        }
        return true;
      });
      newState = {
        content: newChildren,
        document: state.document,
        globalId: state.globalId,
        owner: state.owner,
      };
    }
  }
  document
    .querySelectorAll(".hidden")
    // @ts-ignore
    .forEach((e) => (e.style.display = "none"));
  return newState;
}
type RichTextFrameProps = {
  content?: Array<React.FC>;
  document?: string; //DocumentResource;
  globalId?: number;
  owner: string;
};
/**
 * This Component is for displaying numerous blocks and a console used to manipulate them
 */
const RichTextFrame: React.FC<RichTextFrameProps> = observer(
  (props: RichTextFrameProps) => {
    console.log(`in richtextframe props.document is ${props.document}`);
    const [state, dispatch] = React.useReducer(reduce, {
      ...props,
      globalId: 1,
      content: [],
    });

    // const init = (
    //   <RichTextBlock
    //     // @ts-ignore
    //     document={getNewDoc(props.owner, props.document, 1)}
    //     id={`${1}`}
    //     dispatcher={dispatch}></RichTextBlock>
    // );
    return (
      <div id={styles["rich-text-frame"]} className={styles.manifest}>
        <div id={`${styles["rich-text-content"]}`}>{state.content}</div>
        <RichTextConsole dispatcher={dispatch}></RichTextConsole>
      </div>
    );
  }
);

export default RichTextFrame;
