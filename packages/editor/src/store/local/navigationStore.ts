import { IObservableArray, makeObservable, observable } from "mobx";
import { SessionStore } from "./SessionStore";

export class NavigationStore {
  // See MenuPortal.tsx for explanation
  public menuPortalChildren: { children: IObservableArray<any> }[] = [];

  constructor(private sessionStore: SessionStore) {
    makeObservable(this, {
      menuPortalChildren: observable.shallow,
    });
  }
}
