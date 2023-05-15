import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { uri } from "vscode-lib";
import { TypeCellIdentifier } from "../../identifiers/TypeCellIdentifier";
import {
  defaultShorthandResolver,
  parseFullIdentifierString,
} from "../../identifiers/paths/identifierPathHelpers";
import { DocConnection } from "../../store/DocConnection";
import ProfileResource from "../../store/ProfileResource";
import { getStoreService } from "../../store/local/stores";
import { AliasCoordinator } from "../../store/yjs-sync/AliasCoordinator";
import DocumentView from "../documentRenderers/DocumentView";
import { SupabaseSessionStore } from "../supabase-auth/SupabaseSessionStore";

let aliasStore = new AliasCoordinator("sdfdsf");

export const DocumentRoute = observer(() => {
  const sessionStore = getStoreService().sessionStore;
  if (!(sessionStore instanceof SupabaseSessionStore)) {
    throw new Error("No session store");
  }

  let params = useParams();
  let owner = params.userParam;
  let workspace = params.workspaceParam;
  let document = params["*"];

  const [aliasResolveStatus, setAliasResolveStatus] = useState<
    "loading" | "error" | "not-found" | "loaded"
  >("loading");

  const [ownerDoc, setOwnerDoc] = useState<DocConnection>();

  if (!owner || owner.length < 2 || !owner.startsWith("@")) {
    throw new Error("No owner"); // TODO: 404 / pass through
  }
  owner = owner.substring(1);

  const ownerProfileIdentifier = useMemo(() => {
    return (
      aliasStore.aliases.get(owner!) || {
        status: aliasResolveStatus,
      }
    );
  }, [owner, aliasResolveStatus]);

  if (
    typeof ownerProfileIdentifier !== "string" &&
    ownerProfileIdentifier.status === "loaded"
  ) {
    throw new Error(
      "should never be 'loaded', because then it should just be the identifier"
    );
  }

  useEffect(() => {
    if (typeof ownerProfileIdentifier !== "string") {
      setOwnerDoc(undefined);
      return;
    }

    const doc = DocConnection.load(ownerProfileIdentifier);
    setOwnerDoc(doc);

    return () => {
      doc.dispose();
    };
  }, [ownerProfileIdentifier]);

  // TODO: cache in local alias cache
  useEffect(() => {
    if (!owner) {
      throw new Error("No owner");
    }

    if (typeof ownerProfileIdentifier === "string") {
      return;
    }

    // if (workspace !== "public") {
    //   setWorkspaceId("not-found");
    //   return;
    // }

    (async () => {
      console.log("load");
      const { data, error } = await sessionStore.supabase
        .from("workspaces")
        .select()
        .eq("name", owner)
        .single();

      if (error) {
        setAliasResolveStatus("error");
        return;
      }

      if (!data) {
        setAliasResolveStatus("not-found");
        return;
      }

      // @ts-expect-error
      const nanoId = data.document_nano_id;
      const id = new TypeCellIdentifier(
        uri.URI.from({
          scheme: "typecell", // TODO
          authority: "typecell.org", // TODO
          path: "/" + nanoId,
        })
      );
      aliasStore.aliases.set(owner, id.toString());
      setAliasResolveStatus("loaded");
    })();
  }, [owner, ownerProfileIdentifier]);

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
  for (let item of profileDoc.workspaces.keys()) {
    const sh = "@" + owner + "/" + item;
    defaultShorthandResolver.current.addShorthand(
      sh,
      profileDoc.workspaces.get(item)!
    );
  }

  if (!wsId) {
    return <div>Workspace not found</div>;
  }

  const parsedIdentifier = parseFullIdentifierString(wsId);

  if (!document) {
    return <DocumentView id={parsedIdentifier} subIdentifiers={[]} />;
  }

  return <div>subdoc</div>;

  // const parsedIdentifier = pathToIdentifier(document, [workspaceId]);
  // return <DocumentView id={workspaceId} subIdentifiers={[parsedIdentifier]} />;
});
