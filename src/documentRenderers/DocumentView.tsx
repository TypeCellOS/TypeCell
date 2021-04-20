import { observer } from "mobx-react-lite";
import * as React from "react";
import { useState } from "react";
import { BaseResource } from "../store/BaseResource";
import { DocConnection } from "../store/DocConnection";
import PluginResource from "../store/PluginResource";
import CreateDocumentView from "./CreateDocumentView";
import { CustomRenderer } from "./custom/CustomRenderer";
import NotebookRenderer from "./notebook/NotebookRenderer";
import PluginRenderer from "./plugin/PluginRenderer";
import RichTextRenderer from "./richtext";

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
  const [loader, setLoader] = useState<BaseResource>();

  React.useEffect(() => {
    const newLoader = DocConnection.load({
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
  if (!loader.type) {
    return <CreateDocumentView resource={loader} />;
  }
  if (loader.type === "!notebook") {
    return <NotebookRenderer document={loader.doc!} />;
  } else if (loader.type === "!richtext") {
    return <RichTextRenderer document={loader.doc!} />;
  } else if (loader.type === "!plugin") {
    return <PluginRenderer plugin={loader.getSpecificType(PluginResource)!} />;
  } else if (loader.type.startsWith("!")) {
    throw new Error("invalid built in type");
  } else {
    return <CustomRenderer document={loader} />;
  }
});

export default DocumentView;
