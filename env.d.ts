declare module '@env' {
  // Only declare variables the app reads. Everything here is compiled into the
  // app, so never put a secret (a client secret, a private key) in this file or
  // in .env.
  export const BASE_URL: string;
  export const CLIENT_URL: string;
  export const CONNECT_URL: string;
  export const GOOGLE_CLIENT_ID: string;
  export const ONESIGNAL_APP_ID: string;
}
