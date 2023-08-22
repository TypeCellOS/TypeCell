import {
  AsyncSelect,
  LoadingIndicatorProps,
  OptionType,
} from "@atlaskit/select";
import Spinner from "@atlaskit/spinner";
import { useCallback } from "react";
import { SupabaseClientType } from "../../SupabaseSessionStore";
import { User } from "./userUtils";

export function SupabaseUserPicker(props: {
  //   excludeUserId: string;
  supabase: SupabaseClientType;
  updateSelectedUser: (user: User | undefined) => void;
}) {
  const updateSelectedUser = props.updateSelectedUser;

  async function searchUsers(query = "") {
    if (query === "") {
      return [];
      // setDisplayedUsers([]);
    } else {
      const ret = await props.supabase
        .from("workspaces")
        .select("*")
        .eq("is_username", true)
        .ilike("name", query + "%")
        .order("name")
        .limit(10);

      const results =
        ret.data?.map((result) => ({
          label: "@" + result.name,
          value: {
            id: result.owner_user_id,
            name: "@" + result.name,
            nameWithoutAtSign: result.name,
          },
          // id: result.owner_user_id,
          // name: "@" + result.name,
          // nameWithoutAtSign: result.name,
        })) || [];
      return results;
      // setDisplayedUsers(results);
    }
  }

  const onChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (user: any) => {
      if (Array.isArray(user)) {
        throw new Error("unexpected");
      }
      updateSelectedUser(user?.value || undefined);
    },
    [updateSelectedUser]
  );

  const LoadingIndicator = (props: LoadingIndicatorProps<OptionType>) => {
    return <Spinner {...props} />;
  };

  return (
    <AsyncSelect
      fieldId="add-user"
      width={"auto"}
      cacheOptions
      onChange={onChange}
      loadOptions={searchUsers}
      menuPosition="fixed"
      backspaceRemovesValue
      isClearable
      
      components={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        LoadingIndicator: LoadingIndicator as any,
      }}
    />
  );
}
