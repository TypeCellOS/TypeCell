import { getRandomUserData } from "@typecell-org/shared-test";
import { when } from "mobx";
import { SupabaseSessionStore } from "../../src/app/supabase-auth/SupabaseSessionStore";

export async function loginAsNewRandomUser(
  sessionStore: SupabaseSessionStore,
  basename: string
) {
  const userData = getRandomUserData(basename);

  const { data, error } = await sessionStore.supabase.auth.signUp(userData);

  if (error) {
    throw error;
  }

  await when(() => !!sessionStore.userId);

  await sessionStore.setUsername(userData.name);

  return {
    user: data.user,
    session: data.session,
    supabase: sessionStore.supabase,
  };
}
