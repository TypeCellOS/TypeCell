import { observer } from "mobx-react-lite";
import * as React from "react";
import { useState } from "react";
import { DocConnection } from "../store/DocConnection";
import PluginResource from "../store/PluginResource";
import { CustomRenderer } from "./custom/CustomRenderer";
import NotebookRenderer from "./notebook/NotebookRenderer";
import PluginRenderer from "./plugin/PluginRenderer";
import RichTextRenderer from "./richtext/RichTextRenderer";

type Props = {
  id: string | { owner: string; document: string };
};

const DocumentView = observer((props: Props) => {
  const [connection, setConnection] = useState<DocConnection>();

  React.useEffect(() => {
    const newConnection = DocConnection.load(props.id);

    setConnection(newConnection);
    return () => {
      newConnection.dispose();
      setConnection(undefined);
    };
  }, [props.id]);

  if (!connection) {
    return null;
  }
  if (connection.doc === "loading") {
    return <div>Loading</div>;
  } else if (connection.doc === "not-found") {
    return <div>Not found</div>;
  }
  if (connection.doc.type === "!notebook") {
    return (
      <NotebookRenderer key={connection.doc.id} document={connection.doc.doc} />
    );
  } else if (connection.doc.type === "!richtext") {
    return (
      <RichTextRenderer key={connection.doc.id} document={connection.doc.doc} />
    );
  } else if (connection.doc.type === "!plugin") {
    return (
      <PluginRenderer
        key={connection.doc.id}
        plugin={connection.doc.getSpecificType(PluginResource)!}
      />
    );
  } else if (connection.doc.type.startsWith("!")) {
    throw new Error("invalid built in type");
  } else {
    return <CustomRenderer key={connection.doc.id} document={connection.doc} />;
  }
});

export default DocumentView;
