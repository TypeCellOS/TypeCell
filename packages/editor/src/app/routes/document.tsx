import { observer } from "mobx-react-lite";
import { useLocation } from "react-router-dom";
import { tryPathToIdentifiers } from "../../identifiers/paths/identifierPathHelpers";
import { SessionStore } from "../../store/local/SessionStore";
import DocumentView from "../documentRenderers/DocumentView";
import { SupabaseSessionStore } from "../supabase-auth/SupabaseSessionStore";
import { RouteContext } from "./RouteContext";
import { OwnerAliasRoute } from "./ownerAlias";

export const DocumentRoute = observer(
  (props: { sessionStore: SessionStore }) => {
    const { sessionStore } = props;
    if (!(sessionStore instanceof SupabaseSessionStore)) {
      throw new Error("No session store");
    }

    let location = useLocation();

    if (!sessionStore.coordinators) {
      return <div>Loading</div>;
    }

    let [owner, workspace, ...documentParts] = location.pathname
      .substring(1)
      .split("/");
    const document = documentParts.join("/");

    if (!owner || owner.length < 2 || !owner.startsWith("@")) {
      const identifiers = tryPathToIdentifiers(location.pathname.substring(1));
      if (identifiers !== "invalid-identifier") {
        return (
          <RouteContext.Provider value={{ groups: [identifiers] }}>
            <DocumentView
              id={identifiers.shift()!}
              subIdentifiers={identifiers}
              sessionStore={sessionStore}
            />
          </RouteContext.Provider>
        );
      } else {
        return <div>Not found</div>;
      }
    }

    owner = owner.substring(1);

    return (
      <OwnerAliasRoute
        owner={owner}
        workspace={workspace}
        document={document}
        sessionStore={sessionStore}
      />
    );
  }
);
