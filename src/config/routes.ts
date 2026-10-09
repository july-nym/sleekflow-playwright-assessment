/** Where the Start Free Trial and Log In links on sleekflow.io lead, relative to the app URL. */
export const entryPaths = {
  signup: '/en?screen_hint=signup',
  login: '/en/inbox?screen_hint=login',
} as const;

/** URL patterns of the hosted SSO steps. */
export const ssoSteps = {
  signupEmail: /\/u\/signup\/identifier/,
  loginIdentifier: /\/u\/login\/identifier/,
  loginPassword: /\/u\/login\/password/,
} as const;
