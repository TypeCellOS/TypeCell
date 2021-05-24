import { action, makeObservable, observable, reaction } from "mobx";
import { authStore } from "../../matrix/AuthStore";

export class NavigationStore {
  public isLoginScreenVisible = false;
  public isNewPageDialogVisible = false;

  constructor() {
    makeObservable(this, {
      isLoginScreenVisible: observable,
      showLoginScreen: action,
      hideLoginScreen: action,
      isNewPageDialogVisible: observable,
      showNewPageDialog: action,
      hideNewPageDialog: action,
    });

    // hide login screen when logged in
    reaction(
      () => this.isLoginScreenVisible && authStore.loggedIn,
      (val) => {
        if (val) {
          this.hideLoginScreen();
        }
      }
    );

    reaction(
      () => authStore.loggedIn,
      (val) => {
        if (!val) {
          this.isNewPageDialogVisible = false;
        }
      }
    );
  }

  hideLoginScreen = () => {
    this.isLoginScreenVisible = false;
  };

  showLoginScreen = () => {
    this.isLoginScreenVisible = true;
  };

  showNewPageDialog = () => {
    this.isNewPageDialogVisible = true;
  };

  hideNewPageDialog = () => {
    this.isNewPageDialogVisible = false;
  };
}

export const navigationStore = new NavigationStore();
