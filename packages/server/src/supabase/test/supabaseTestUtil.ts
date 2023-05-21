import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider";
import { uniqueId } from "@typecell-org/common";
import * as Y from "yjs";
import { getRandomUserData } from "../../test/dataUtil";
import { generateUuid } from "../../util/uuid";
import { createAnonClient } from "../supabase";
// const SUPABASE_URL = "http://localhost:8000/";
// const ANON_KEY =
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";
// const SERVICE_KEY =
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";

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
