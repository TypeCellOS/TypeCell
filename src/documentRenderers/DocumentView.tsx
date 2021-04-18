import { observer } from "mobx-react-lite";
import * as React from "react";
import { useState } from "react";
import LoadingTCDocument from "../store/LoadingTCDocument";
import TCDocument from "../store/TCDocument";
import CreateDocumentView from "./CreateDocumentView";
import { CustomRenderer } from "./custom";
import NotebookRenderer from "./notebook";
import RichText from "./richtext";

type Props = {
  owner: string;
  document: string;
};

const DocumentView = observer((props: Props) => {
  if (!props.owner || !props.document) {
    // return <div></div>
    throw new Error(
      "DocumentView expects both owner and document to be specified"
    );
  }
  const [loader, setLoader] = useState<LoadingTCDocument>();

  React.useEffect(() => {
    const newLoader = LoadingTCDocument.load({
      owner: props.owner,
      document: props.document,
    });

    setLoader(newLoader);
    return () => {
      newLoader.dispose();
      setLoader(undefined);
    };
  }, [props.owner, props.document]);

  if (!loader) {
    return null;
  }
  if (!loader.doc) {
    return <CreateDocumentView document={loader} />;
  }
  if (loader.doc.type === "!notebook") {
    return <NotebookRenderer document={loader.doc} />;
  } else if (loader.doc.type === "!richtext") {
    return <RichText document={loader.doc} />;
  } else if (loader.doc.type.startsWith("!")) {
    throw new Error("invalid built in type");
  } else {
    return <CustomRenderer document={loader.doc} />;
  }
});

export default DocumentView;
