/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider";
import { uniqueId } from "@typecell-org/util";
import * as Y from "yjs";
import { getRandomUserData } from "./randomUser.js";
import { createAnonClient } from "./supabase.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createWsProvider(url: string, ws?: any) {
  return new HocuspocusProviderWebsocket({
    url,
    WebSocketPolyfill: ws,
  });
}

export function createDocument(
  userId: string,
  data: string,
  public_access_level: "read" | "write" | "no-access"
) {
  const date = JSON.stringify(new Date());
  return {
    id: uniqueId.generateUuid(),
    created_at: date,
    updated_at: date,
    data,
    nano_id: uniqueId.generateId("document"),
    public_access_level,
    user_id: userId,
  } as const;
}

export async function createRandomUser(
  name: string,
  env: {
    VITE_TYPECELL_SUPABASE_URL: string;
    VITE_TYPECELL_SUPABASE_ANON_KEY: string;
  } = {
    VITE_TYPECELL_SUPABASE_URL: process.env.VITE_TYPECELL_SUPABASE_URL!,
    VITE_TYPECELL_SUPABASE_ANON_KEY:
      process.env.VITE_TYPECELL_SUPABASE_ANON_KEY!,
  }
) {
  const userData = getRandomUserData(name);

  const supabase = await createAnonClient(env);
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
