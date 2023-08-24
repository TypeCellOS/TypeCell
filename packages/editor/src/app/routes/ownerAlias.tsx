import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { uri } from "vscode-lib";
import { TypeCellIdentifier } from "../../identifiers/TypeCellIdentifier";
import {
  defaultShorthandResolver,
  parseFullIdentifierString,
  pathToIdentifiers,
} from "../../identifiers/paths/identifierPathHelpers";
import { DocConnection } from "../../store/DocConnection";
import ProfileResource from "../../store/ProfileResource";
import { SessionStore } from "../../store/local/SessionStore";
import DocumentView from "../documentRenderers/DocumentView";
import { SupabaseSessionStore } from "../supabase-auth/SupabaseSessionStore";
import { RouteContext } from "./RouteContext";
import { URLUpdater } from "./URLUpdater";

type Props = {
  owner: string;
  workspace?: string;
  document?: string;
  sessionStore: SessionStore;
};
export const OwnerAliasRoute = observer(
  ({ owner, workspace, document, sessionStore }: Props) => {
    if (!(sessionStore instanceof SupabaseSessionStore)) {
      throw new Error("No session store");
    }

    const location = useLocation();

    const [aliasResolveStatus, setAliasResolveStatus] = useState<
      "loading" | "error" | "not-found" | "loaded"
    >("loading");

    const [ownerDoc, setOwnerDoc] = useState<DocConnection>();

    const alias = sessionStore.aliasCoordinator?.aliases.get(owner);
    const ownerProfileIdentifier = useMemo(() => {
      return (
        alias || {
          status: aliasResolveStatus,
        }
      );
    }, [alias, aliasResolveStatus]);

    useEffect(() => {
      if (typeof ownerProfileIdentifier !== "string") {
        setOwnerDoc(undefined);
        return;
      }

      const doc = DocConnection.load(ownerProfileIdentifier, sessionStore);
      setOwnerDoc(doc);

      return () => {
        doc.dispose();
      };
    }, [ownerProfileIdentifier, sessionStore]);

    useEffect(() => {
      if (!owner) {
        throw new Error("No owner");
      }

      const aliasCoordinator = sessionStore.aliasCoordinator;
      if (!aliasCoordinator) {
        return;
      }

      if (typeof ownerProfileIdentifier === "string") {
        return;
      }

      (async () => {
        console.log("load alias", owner);
        const { data, error } = await sessionStore.supabase
          .from("workspaces")
          .select()
          .eq("name", owner)
          .eq("is_username", true)
          .limit(1);

        if (error) {
          setAliasResolveStatus("error");
          return;
        }

        if (!data || !data.length) {
          setAliasResolveStatus("not-found");
          return;
        }

        const nanoId = data[0].document_nano_id;
        const id = new TypeCellIdentifier(
          uri.URI.from({
            scheme: "typecell", // TODO
            authority: "typecell.org", // TODO
            path: "/" + nanoId,
          })
        );
        aliasCoordinator.aliases.set(owner, id.toString());
        setAliasResolveStatus("loaded");
      })();
    }, [
      owner,
      ownerProfileIdentifier,
      sessionStore.aliasCoordinator,
      sessionStore.supabase,
    ]);

    if (typeof ownerProfileIdentifier !== "string") {
      if (ownerProfileIdentifier.status === "loading") {
        return <div>Loading alias</div>;
      }

      if (ownerProfileIdentifier.status === "not-found") {
        return <div>User not found</div>;
      }

      if (ownerProfileIdentifier.status === "error") {
        return <div>Error loading user</div>;
      }

      if (ownerProfileIdentifier.status === "loaded") {
        // edge case where AliasCoordinator is probably initializing
        return <div>Loading alias</div>;
      }

      throw new Error("Unexpected");
    }

    if (!workspace) {
      const id = parseFullIdentifierString(ownerProfileIdentifier);
      return (
        <RouteContext.Provider value={{ groups: [[id]] }}>
          <DocumentView
            id={id}
            subIdentifiers={[]}
            sessionStore={sessionStore}
          />
        </RouteContext.Provider>
      );
    }

    if (!workspace) {
      return <div>User profile</div>;
    }

    const doc = ownerDoc?.doc;
    if (doc === "loading" || !doc) {
      return <div>Loading user</div>;
    }

    if (doc === "not-found") {
      console.warn("unexpected, user not found");
      return <div>User not found</div>;
    }

    const profileDoc = doc.getSpecificType(ProfileResource);
    const wsId = profileDoc.workspaces.get(workspace);

    // TODO: hacky

    const sh = "@" + owner;
    defaultShorthandResolver.current.addShorthand(
      sh,
      profileDoc.identifier.toString()
    );

    for (const item of profileDoc.workspaces.keys()) {
      const sh = "@" + owner + "/" + item;

      defaultShorthandResolver.current.addShorthand(
        sh,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        profileDoc.workspaces.get(item)!
      );
    }

    if (!wsId) {
      return <div>Workspace not found</div>;
    }

    const parsedIdentifier = parseFullIdentifierString(wsId);

    if (!document) {
      return (
        <RouteContext.Provider
          value={{ groups: [[doc.identifier], [parsedIdentifier]] }}>
          <DocumentView
            id={parsedIdentifier}
            subIdentifiers={[]}
            sessionStore={sessionStore}
          />
        </RouteContext.Provider>
      );
    }

    const identifiers = pathToIdentifiers(
      decodeURIComponent(location.pathname).substring(1)
    );
    const [id, ...subs] = identifiers;
    return (
      <RouteContext.Provider
        value={{ groups: [[doc.identifier], [id, ...subs]] }}>
        <URLUpdater identifiers={identifiers} sessionStore={sessionStore} />
        <DocumentView
          id={id}
          subIdentifiers={subs}
          sessionStore={sessionStore}
        />
      </RouteContext.Provider>
    );

    // const parsedIdentifier = pathToIdentifier(document, [workspaceId]);
    // return <DocumentView id={workspaceId} subIdentifiers={[parsedIdentifier]} />;
  }
);
