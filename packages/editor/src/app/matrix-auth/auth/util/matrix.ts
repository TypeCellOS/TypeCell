export interface IMatrixClientCreds {
  homeserverUrl: string;
  identityServerUrl: string | undefined;
  userId: string;
  deviceId?: string;
  accessToken: string;
  guest?: boolean;
  pickleKey?: string | undefined;
  freshLogin?: boolean;
}
