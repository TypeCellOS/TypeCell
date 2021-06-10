import { NodeViewContent } from "@tiptap/react";
import { untracked } from "mobx";
import { ElementType, useState } from "react";
import { VscChevronDown, VscChevronRight } from "react-icons/vsc";
import mergeAttributesReact from "../../util/mergeAttributesReact";
import styles from "./CollapseWrapper.module.css";

export type CollapseWrapperProps = {
  attrs: any[];
  domType: ElementType;
};

export const CollapseWrapper: React.FC<CollapseWrapperProps> = (props) => {
  const [isVisible, setVisible] = useState(untracked(() => false));

  return (
    <div className={styles.outerContainer}>
      <div contentEditable={false}>
        {isVisible ? (
          <VscChevronDown
            title="Hide content"
            className="notebookCell-sideIcon"
            onClick={() => setVisible(false)}
          />
        ) : (
          <VscChevronRight
            title="Show content"
            className="notebookCell-sideIcon"
            onClick={() => setVisible(true)}
          />
        )}
      </div>
      {isVisible && (
        <NodeViewContent
          as={props.domType}
          {...mergeAttributesReact(...props.attrs)}
        />
      )}
    </div>
  );
};
