export interface UserProfileData {
  name: string,
  bio: string,
  github: string,
  twitter: string
}

// TODO: Find better way of permanently storing user profile data.
class UserStore {
  public initializeUserProfileData(user: string) {
    const userProfileData: UserProfileData = {
      name: user.substring(1),
      bio: "",
      github: "",
      twitter: ""
    }
    localStorage.setItem(user, JSON.stringify(userProfileData));
  }

  public userProfileDataIsInitialized(user: string) {
    return !!localStorage.getItem(user);
  }

  public getUserProfileData(user: string): UserProfileData {
    return JSON.parse(localStorage.getItem(user)!);
  }

  public setUserProfileData(user: string, userProfileData: UserProfileData) {
    localStorage.setItem(user, JSON.stringify(userProfileData));
  }
}

export const userStore = new UserStore();
