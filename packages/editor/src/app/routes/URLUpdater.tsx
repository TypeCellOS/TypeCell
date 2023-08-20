import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Identifier } from "../../identifiers/Identifier";
import { TypeCellIdentifier } from "../../identifiers/TypeCellIdentifier";
import { DocConnection } from "../../store/DocConnection";
import { SessionStore } from "../../store/local/SessionStore";
import { slug } from "../../util/slug";

// This updates the url in the address bar based on the document title
// The ideal solution would probably be closer integrated to routing / identifiers,
// but this works for now
export const URLUpdater = observer(
  (props: { identifiers: Identifier[]; sessionStore: SessionStore }) => {
    const lastIdentifier = props.identifiers[props.identifiers.length - 1];
    const connection = DocConnection.get(lastIdentifier, props.sessionStore);

    let title: string | undefined;
    let titleSet = false;
    if (
      lastIdentifier instanceof TypeCellIdentifier &&
      connection?.tryDoc?.type === "!richtext"
    ) {
      title = connection.tryDoc.doc.title;
      titleSet = true;
    }

    useEffect(() => {
      if (!titleSet) {
        return;
      }
      if (!(lastIdentifier instanceof TypeCellIdentifier)) {
        throw new Error("not expected");
      }

      const slugged = slug(title || "");
      const newPath = slugged.length
        ? "/" + slugged + "~" + lastIdentifier.documentId
        : "/" + lastIdentifier.documentId;
      const url = window.location.href.replace(
        new RegExp("/([^/]*~)?" + lastIdentifier.documentId),
        newPath
      );
      // console.log("title change", title, url);
      window.history.replaceState(window.history.state, "", url);
    }, [title, lastIdentifier, titleSet]);

    return null;
  }
);
