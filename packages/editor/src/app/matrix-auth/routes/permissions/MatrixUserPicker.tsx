import UserPicker from "@atlaskit/user-picker";
import { useCallback, useState } from "react";
import { IntlProvider } from "react-intl-next";
import { friendlyUserId } from "../../../../util/userIds";
import { MatrixClientPeg } from "../../MatrixClientPeg";
import { User } from "./userUtils";

export function MatrixUserPicker(props: {
  //   excludeUserId: string;
  updateSelectedUser: (user: User | undefined) => void;
}) {
  const updateSelectedUser = props.updateSelectedUser;
  // State and function for storing & updating the users to display in the user picker.
  const [displayedUsers, setDisplayedUsers] = useState<User[]>([]);

  async function searchUsers(query: string = "") {
    const peg = MatrixClientPeg.get();

    if (!peg || query === "") {
      setDisplayedUsers([]);
    } else {
      const ret = await peg.searchUserDirectory({
        term: query || "mx", // mx is a trick to return all users on mx.typecell.org
        limit: 10,
      });

      const results: User[] = ret.results
        // .filter((result: any) => result.display_name !== props.excludeUserId)
        .map((result: any) => ({
          id: result.user_id,
          name: friendlyUserId(result.user_id),
        }));

      setDisplayedUsers(results);
    }
  }

  const onChange = useCallback(
    (user: User | User[] | null | undefined) => {
      if (Array.isArray(user)) {
        throw new Error("unexpected");
      }
      updateSelectedUser(user || undefined);
    },
    [updateSelectedUser]
  );

  return (
    <IntlProvider locale="en">
      <UserPicker
        fieldId="add-user"
        width={"auto"}
        allowEmail={true}
        noOptionsMessage={() => null}
        onInputChange={searchUsers}
        onChange={onChange}
        options={displayedUsers}
        menuPosition="fixed"
      />
    </IntlProvider>
  );
}
