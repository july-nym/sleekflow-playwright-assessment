# SleekFlow signup and login tests

Playwright tests for the signup and login screens behind sleekflow.io, written as Gherkin scenarios on top of page objects. The Start Free Trial and Log In links on sleekflow.io open `app.sleekflow.io`, which redirects to the hosted forms on `sso.sleekflow.io`. Signup asks for an email address and consent to the terms. Login asks for an email or username, then shows the password field.

## Project layout

```text
features/          Gherkin scenarios, one file per flow
src/config/        app URL, test account and SSO URL patterns
src/locators/      every element of a screen as a named locator
src/pages/         page objects with the actions a user takes
src/steps/         step definitions that connect the scenarios to the page objects
src/fixtures.ts    Playwright fixtures and the Given, When and Then functions
```

A step such as `When I submit the signup form` matches a definition in `src/steps/signup.steps.ts`. That definition calls `SignupPage.submit()`, which clicks `signUpButton` from `src/locators/signup.locators.ts`. Assertions live in the `Then` steps. `bddgen` turns the feature files into Playwright tests in `.features-gen/`, which git ignores. `npm test`, `npm run test:smoke` and `npm run test:auth` run it first; run `npx bddgen` yourself before calling `npx playwright test` directly.

## Run locally

Use Node.js 22.13 or a later 22.x release, or Node.js 24 and newer. ESLint 10 does not support Node.js 23. `.nvmrc` pins 22.

```sh
npm ci
npx playwright install chromium
npm run lint
npm run typecheck
npm run test:smoke
```

`npm run format` applies Prettier, and CI runs `npm run format:check`.

The six `@smoke` scenarios cover the consent controls, blank and malformed signup emails, a consented signup request, a blank login identifier, and a blank password. The scenario that submits the signup form intercepts every POST the page sends. The request with the typed email gets a stub page. Any other POST is aborted, so if the payload changes, the scenario fails without creating an account.

## Account-backed scenarios

The two `@auth` scenarios in `features/login.feature` check the response to a wrong password and the redirect back to the app after a successful sign-in. `npm test` runs all eight scenarios and skips these two unless all three variables below are set. Use a synthetic account in an authorized test tenant, preferably with a controlled mailbox. Copy `.env.example` to `.env` and fill it in, or set the variables in the shell, where they take precedence over `.env`:

```sh
SLEEKFLOW_APP_URL='https://<authorized-app-host>' \
SLEEKFLOW_TEST_EMAIL='qa-user@<owned-test-domain>' \
SLEEKFLOW_TEST_PASSWORD='<test-account-password>' \
SLEEKFLOW_RUN_AUTH_TESTS=1 npm run test:auth
```

`SLEEKFLOW_APP_URL` defaults to `https://app.sleekflow.io`; point it at an authorized test environment when one is available. The email above is a placeholder. Use an account you control, with an address that can receive any verification messages. Run at most one wrong-password attempt per run so the account does not get locked, and keep credentials out of the repository and its issue tracker.

Both scenarios passed on 9 October 2026 with an existing account. Completing signup through email verification and reaching a protected workspace would need a sandbox mailbox, account cleanup and a known post-login page, so this suite stops before that and creates no account on the public site.

## Adding a scenario

Write the scenario in a `.feature` file and run `npx bddgen`. It lists every step that has no definition yet, with a snippet to start from. New elements go in the screen's locator file, new actions in its page object, and the step definition in `src/steps/`.

## CI and failures

`.github/workflows/playwright.yml` runs on pushes and pull requests. It checks formatting, runs ESLint and the type check, then runs the `@smoke` scenarios in Chromium. CI never runs the `@auth` scenarios. SleekFlow's SSO can answer the login identifier step with a CAPTCHA, which has been seen on GitHub-hosted runners. When that happens, the scenarios that need the password step are skipped with that reason. If a run fails, it uploads the HTML report and the test artifacts.

Playwright keeps a screenshot, a video and a trace for each failed scenario, and the trace includes browser console and network events. Locally the report is in `playwright-report/` and the artifacts in `test-results/`, both ignored by git. Open them with `npm run test:report` or the trace path that Playwright prints. Check artifacts for account data before sharing them.

The written answers to all three parts of the exercise are in `assessment-answers.md`.
