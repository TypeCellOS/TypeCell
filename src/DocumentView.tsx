import { observer } from "mobx-react-lite";
import * as React from "react";
import { useState } from "react";
import { useRef } from "react";
import { CustomRenderer } from "./documentRenderers/custom";
import CellList from "./documentRenderers/notebook/CellList";
import RichText from "./documentRenderers/richtext";
import TCDocument from "./store/TCDocument";

type Props = {
  owner: string;
  document: string;
};

const DocumentView = observer((props: Props) => {
  if (!props.owner || !props.document) {
    // return <div></div>
    throw new Error("DocumentView expects both owner and document to be specified");
  }
  const [doc, setDoc] = useState<TCDocument>();

  React.useEffect(() => {
    const newDoc = TCDocument.load(
      props.owner + "/" + props.document,
      props.document === "home" ? "@yousefed/renderer" : "!notebook"
    );

    setDoc(newDoc);
    return () => {
      newDoc.dispose();
      setDoc(undefined);
    }
  }, [props.owner, props.document]);

  if (!doc) {
    return null;
  }
  // return <div>{doc.title.toJSON()}</div>
  if (doc.type === "!notebook") {
    return <CellList document={doc} />;
  } else if (doc.type === "!richtext") {
    return <RichText document={doc} />;
  } else {
    return <CustomRenderer rendererDocumentId={doc.type} />;
  }
});

export default DocumentView;
