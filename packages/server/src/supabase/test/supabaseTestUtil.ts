import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider";
import { uniqueId } from "@typecell-org/common";
import * as Y from "yjs";
import { getRandomUserData } from "../../../../commonTest/src/randomUser";
import { generateUuid } from "../../util/uuid";
import { createAnonClient } from "../supabase";

export function createDocument(
  userId: string,
  data: string,
  public_access_level: "read" | "write" | "no-access"
) {
  const date = JSON.stringify(new Date());
  return {
    id: generateUuid(),
    created_at: date,
    updated_at: date,
    data,
    nano_id: uniqueId.generateId("document"),
    public_access_level,
    user_id: userId,
  } as const;
}

export async function createRandomUser(name: string) {
  const userData = getRandomUserData(name);

  const supabase = await createAnonClient();
  const { data, error } = await supabase.auth.signUp(userData);
  if (error) {
    throw error;
  }
  return {
    user: data.user,
    session: data.session,
    supabase,
  };
}

export function createWsProvider(ws?: any) {
  return new HocuspocusProviderWebsocket({
    url: "ws://localhost:1234",
    WebSocketPolyfill: ws,
  });
}

export function createHPProvider(
  docId: string,
  ydoc: Y.Doc,
  token: string,
  wsProvider: HocuspocusProviderWebsocket
) {
  return new HocuspocusProvider({
    name: docId,
    document: ydoc,
    token,
    websocketProvider: wsProvider,
    broadcast: false,
  });
}
