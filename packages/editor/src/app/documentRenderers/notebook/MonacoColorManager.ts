import { lifecycle } from "vscode-lib";
import { Awareness } from "y-protocols/awareness";

type User = {
  name: string;
  color: string;
};

function generateUserAwarenessCSS(clientId: number, user: User) {
  const selectionClassName = `yRemoteSelection-${clientId}`;
  const headClassName = `yRemoteSelectionHead-${clientId}`;

  const css =
    `.${selectionClassName}, .${selectionClassName}::after, .${selectionClassName}::before,
       .${headClassName}, .${headClassName}::after, .${headClassName}::before
       {
         background-color: ${user.color} !important;
         border-color: ${user.color} !important;
       }
       
       .${selectionClassName}::after {
         content: '${user.name}'
       }
       `.trim();

  const styleElement = document.createElement("style");

  styleElement.innerText = css;
  document.head.appendChild(styleElement);
  return styleElement;
}

export class MonacoColorManager extends lifecycle.Disposable {
  private readonly userStore = new Map<
    number,
    {
      user: User;
      element: HTMLStyleElement;
    }
  >();

  constructor(
    awareness: Awareness,
    localUsername: string,
    localUserColor: string
  ) {
    super();

    // listen for updates to other clients awareness
    const updateHandler = ({
      added,
      updated,
      removed,
    }: {
      added: any;
      updated: any;
      removed: any;
    }) => {
      const changedClients = added.concat(updated).concat(removed);
      const states = awareness.getStates();
      changedClients.forEach((clientId: number) => {
        const state = states.get(clientId);
        if (state?.user) {
          if (!this.userStore.has(clientId)) {
            const element = generateUserAwarenessCSS(clientId, state.user);
            this.userStore.set(clientId, { user: state.user, element });
          }
        } else {
          // user has been removed (for example, went offline)
          const existingUser = this.userStore.get(clientId);
          if (existingUser) {
            // remove <style> element added for this clientId
            this.userStore.delete(clientId);
            existingUser.element.remove();
          }
        }
      });
    };

    awareness.on("update", updateHandler);

    // Set the current users' awareness info (if not set already)
    const localState = awareness.getLocalState();
    if (
      !localState ||
      !localState.user ||
      localState.user.name !== localUserColor ||
      localState.user.color !== localUserColor
    ) {
      awareness.setLocalStateField("user", {
        name: localUsername,
        color: localUserColor,
      });
    }

    this._register({
      dispose: () => {
        awareness.setLocalStateField("user", null);
        awareness.off("update", updateHandler);

        for (let user of this.userStore.values()) {
          user.element.remove();
          this.userStore.clear();
        }
      },
    });
  }
}
