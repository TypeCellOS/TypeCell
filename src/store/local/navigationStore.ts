import { action, makeObservable, observable, reaction } from "mobx";
import { authStore } from "../../matrix/AuthStore";
import routing from "../../typecellEngine/lib/routing";
import { BaseResource } from "../BaseResource";

export class NavigationStore {
  public isLoginScreenVisible = false;
  public isNewPageDialogVisible = false;
  public currentPage: ReturnType<typeof routing> = routing();

  constructor() {
    makeObservable(this, {
      isLoginScreenVisible: observable,
      showLoginScreen: action,
      hideLoginScreen: action,

      isNewPageDialogVisible: observable,
      showNewPageDialog: action,
      hideNewPageDialog: action,

      currentPage: observable.ref,
      navigateToDocument: action,
      onPopState: action,
    });

    // hide login screen when logged in
    reaction(
      () => this.isLoginScreenVisible && authStore._loggedIn,
      (val) => {
        if (val) {
          this.hideLoginScreen();
        }
      }
    );

    reaction(
      () => authStore._loggedIn,
      (val) => {
        if (!val) {
          this.isNewPageDialogVisible = false;
        }
      }
    );

    window.addEventListener("popstate", this.onPopState);
  }

  onPopState = (e: PopStateEvent) => {
    this.currentPage = routing();
  };

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

  navigateToDocument = (doc: BaseResource) => {
    this.currentPage = {
      page: "document",
      owner: doc.identifier.owner,
      document: doc.identifier.document,
      remainingParts: [],
    };
    const url = "/" + doc.identifier.id;
    window.history.pushState({ url }, "", url);
  };
}

export const navigationStore = new NavigationStore();
