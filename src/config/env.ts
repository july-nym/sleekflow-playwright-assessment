export type TestAccount = {
  email: string;
  password: string;
};

export const MISSING_TEST_ACCOUNT =
  'Set SLEEKFLOW_TEST_EMAIL, SLEEKFLOW_TEST_PASSWORD, and SLEEKFLOW_RUN_AUTH_TESTS=1';

const DEFAULT_APP_URL = 'https://app.sleekflow.io';

export function getAppUrl(): string {
  return process.env.SLEEKFLOW_APP_URL || DEFAULT_APP_URL;
}

/** The account for the @auth scenarios, or undefined until all three variables are set. */
export function readTestAccount(): TestAccount | undefined {
  const email = process.env.SLEEKFLOW_TEST_EMAIL;
  const password = process.env.SLEEKFLOW_TEST_PASSWORD;
  if (process.env.SLEEKFLOW_RUN_AUTH_TESTS !== '1' || !email || !password) return undefined;
  return { email, password };
}
