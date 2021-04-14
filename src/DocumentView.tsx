import { observer } from "mobx-react-lite";
import * as React from "react";
import { useState } from "react";
import { useRef } from "react";
import { CustomRenderer } from "./documentRenderers/custom";
import CellList from "./documentRenderers/notebook/CellList";
import TCDocument from "./store";

type Props = {
  owner: string;
  document: string;
};

const DocumentView = observer((props: Props) => {
  if (!props.owner || !props.document) {
    return <div></div>
    throw new Error("DocumentView expects both owner and document to be specified");
  }
  const [doc, setDoc] = useState<TCDocument>();

  React.useEffect(() => {
    setDoc(TCDocument.load(
      props.owner + "/" + props.document,
      props.document === "home" ? "@yousefed/renderer" : "!notebook"
    ));
    return () => {
      doc?.dispose();
      setDoc(undefined);
    }
  }, [props.owner, props.document]);

  if (!doc) {
    return null;
  }
  // return <div>{doc.title.toJSON()}</div>
  if (doc.type === "!notebook") {
    return <CellList document={doc} />;
  } else if (doc.type === "!document") {
    return <div>Not implemented</div>;
  } else {
    return <CustomRenderer rendererDocumentId={doc.type} />;
  }
});

export default DocumentView;
