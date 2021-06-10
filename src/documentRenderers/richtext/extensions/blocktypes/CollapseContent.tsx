import { NodeViewContent } from "@tiptap/react";
import { ElementType, useState } from "react";
import { VscChevronDown, VscChevronRight } from "react-icons/vsc";
import mergeAttributesReact from "../../util/mergeAttributesReact";
import styles from "./Block.module.css";

export type CollapseContentProps = {
  attrs: any[];
  domType: ElementType;
};

export const CollapseContent: React.FC<CollapseContentProps> = (props) => {
  const [codeVisible, setCodeVisible] = useState(false);

  return (
    <div>
      {codeVisible ? (
        <VscChevronDown
          title="Show / hide code"
          className="notebookCell-sideIcon"
          onClick={() => setCodeVisible(false)}
        />
      ) : (
        <VscChevronRight
          title="Show / hide code"
          className="notebookCell-sideIcon"
          onClick={() => setCodeVisible(true)}
        />
      )}
      {/* <div> Title </div> */}
      {codeVisible && (
        <NodeViewContent
          as={props.domType}
          {...mergeAttributesReact(...props.attrs)}
        />
      )}
    </div>
  );
};
