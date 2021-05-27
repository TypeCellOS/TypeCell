export interface IMatrixClientCreds {
  homeserverUrl: string;
  identityServerUrl: string;
  userId: string;
  deviceId?: string;
  accessToken: string;
  guest?: boolean;
  pickleKey?: string | undefined;
  freshLogin?: boolean;
}
