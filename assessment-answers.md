# QA assessment answers

The public SleekFlow links currently open a hosted SSO flow. Signup begins with an email address and consent to the terms. Login begins with an email or username, then opens a password screen. The Playwright scenarios follow these screens. The defects assumed in the questions and the issues in the chat screenshots were not reproduced on SleekFlow.

## Part 1: Playwright Signup & Login Automation test for sleekflow.io

### 1. Project Setup

Start with `npm init playwright@latest`, which scaffolds `playwright.config.ts`, a tests folder, and an optional GitHub Actions workflow. The manual route is to initialize a Node project, install `@playwright/test`, TypeScript, and Node types, then install Chromium with `npx playwright install chromium`. This repository adds playwright-bdd for Gherkin scenarios, ESLint with the Playwright plugin, and Prettier. Scenarios live in `features/`, and the locators, page objects, steps and fixtures live in `src/`. Set `baseURL` to `https://app.sleekflow.io`, with `SLEEKFLOW_APP_URL` available for an authorized test environment. Run `npm run lint` and `npm run typecheck`, then `npm run test:smoke`, which generates the tests with `bddgen` before running them. `package-lock.json` makes `npm ci` reproducible. On sleekflow.io, the Start Free Trial and Log In links point to `app.sleekflow.io/en?screen_hint=signup` and `app.sleekflow.io/en/inbox?screen_hint=login`, which redirect to the hosted forms on `sso.sleekflow.io`. The scenarios start from those two app URLs and check the SSO screens they land on, without hardcoding the transient `state` query value.

### 2. Test Case Planning

For signup, cover the entry link, required email, malformed email, consent text and links, consent enforcement, and the password step (required field, password rules, and the Edit link back to the email). Past the form, cover an existing account, a new account, email verification by link or six-digit code including resend, and the first signed-in workspace. Check whether duplicate email responses disclose account existence. On a controlled tenant, also cover expired verification links and interrupted signup. The suite here checks the form and intercepts a consented POST, so it creates no account on the public site.

For login, check empty identifier, the transition to the password screen, empty password, wrong password, valid password, session persistence on a protected page, logout, and password reset. Include the lockout rule if the PRD applies. Google and Apple sign-in need separate coverage if those methods are in scope. Use an isolated, pre-provisioned synthetic account for the success case and a single incorrect password for the failure case. The two `@auth` scenarios in `features/login.feature` require explicit environment variables and are skipped otherwise. For a wrong password, assert a visible generic error and no authenticated redirect; for a valid password, assert the app redirect and a protected-page landmark once the test tenant is known.

### 3. Locator Strategy

Each screen keeps its locators in one file under `src/locators/`, as named properties such as `emailInput` and `signUpButton`, so a changed label is fixed in one place. Prefer accessible names: `getByRole('textbox', { name: 'Email address' })`, `getByRole('button', { name: 'Continue', exact: true })`, and `getByRole('textbox', { name: 'Password' })`. Scope duplicate labels to a region, such as `getByRole('main').getByRole('link', { name: 'Privacy Policy' })`. Check the field's `aria-invalid` state and the nearby error text, for example `Wrong username or password`. The custom consent control overlays its input, so the working click targets the associated `label[for="terms-of-service"]`. If we owned the application, stable test IDs would be a fallback for controls without accessible names. Avoid generated CSS classes, positional selectors, and SSO `state` values.

### 4. Waits and Timing

Playwright assertions retry until their timeout: wait for the password field after `Continue`, for the expected error after submission, or for the app URL after successful login. For asynchronous confirmation, wait for a specific visible message or a specific response tied to the action; a controlled test mailbox can poll for the verification email within a fixed deadline. Do not use a fixed sleep to guess when a redirect or message has arrived. Record the request and response if the UI fails to settle before the timeout.

### 5. Test Data Management

Create unique synthetic addresses in a mailbox domain controlled by the test team, inside a sandbox tenant. Provision reusable login accounts as fixtures. For full signup, delete the created account and associated workspace through an approved test API or reset the tenant after the run, including when a test fails. Teardown may not run if the runner crashes or a CI job is cancelled, so each address also carries the run ID, and a scheduled job deletes tagged accounts older than the longest allowed run. Keep cleanup identifiers inside the test environment. The signup scenario that runs against the public site intercepts its POST before it reaches the server, so it leaves no test account behind. The `example.com` addresses in the scenarios are reserved examples and are not used for email verification.

### 6. Reusability

`src/locators/` names every element of a screen, `SignupPage` and `LoginPage` in `src/pages/` hold the actions a user takes, and the Gherkin steps in `src/steps/` call those actions. The login steps are written once, in `LoginPage.goToPasswordStep()`, and three scenarios reuse them. Fixtures in `src/fixtures.ts` give each scenario new page objects in a fresh browser context, plus the test account when one is configured. For tests that need a signed-in user without testing login itself, a setup project logs in once through the UI and saves the session with `storageState`. Projects that depend on it load that file, so each of their tests starts signed in. A fixture created with `test.extend` can also give each test a provisioned account and remove it in teardown once a sandbox exists. The two `@auth` scenarios here are about the login form, so they still sign in through the UI.

### 7. CI Integration

The included GitHub Actions workflow runs on pushes and pull requests. It installs locked dependencies, checks formatting, runs ESLint and the type check, installs Chromium, and runs `npm run test:smoke`, which generates the tests with `bddgen` and runs the `@smoke` scenarios. CI leaves out the account-backed `@auth` scenarios, so it needs no account credentials and does not repeat login attempts against a real account. The SSO can answer the identifier step with a CAPTCHA, which has been seen on GitHub-hosted runners. The scenarios that need the password step detect it and are skipped with that reason, and the suite never tries to solve or bypass the CAPTCHA. A controlled staging job could supply test-account credentials from CI secrets and run `npm run test:auth`; it should publish results only after artifact review.

### 8. Error Handling & Reporting

Playwright keeps a screenshot, video, and trace for a failed test and produces an HTML report. The trace includes browser console and network events. CI uploads the report and test results on failure. Inspect the first failed action, request status, and console errors, then attach the relevant evidence to a bug with exact reproduction steps, environment, and expected versus actual result. Auth traces may contain credentials or session data, so remove those before sharing an artifact.

## Part 2: Test Case Design and Bug Reporting

### 1. Test Case Design

| Test case ID | Title / objective | Priority | Preconditions | Test steps | Test data | Expected result |
| --- | --- | --- | --- | --- | --- | --- |
| TC-AUTH-01 | New account signup | High | Authorized sandbox, controlled test mailbox, unused synthetic address, account cleanup available. | 1. Open Signup.<br>2. Enter the unused address.<br>3. Accept the displayed terms.<br>4. Submit and complete the offered verification and password steps.<br>5. Open the resulting workspace. | Unique synthetic address on the team's test domain; synthetic profile details. | One account is created, verification succeeds, and the user reaches the appropriate workspace. Cleanup removes the account after testing. |
| TC-AUTH-02 | Existing account login | High | Active synthetic account in the sandbox; logged out. | 1. Open Login.<br>2. Enter the account email or username and click Continue.<br>3. Enter its valid password and click Sign in.<br>4. Open a protected page, refresh it, then log out. | Seeded synthetic account; password from test secrets. | The protected page is accessible while signed in, survives a refresh, and requires login again after logout. |
| TC-AUTH-03 | Incorrect password | High | Active synthetic account in the sandbox; its failed-attempt counter is clear. | 1. Open Login.<br>2. Enter the account identifier and click Continue.<br>3. Enter one incorrect password and click Sign in.<br>4. Check the message and protected-page access. | Same synthetic identifier; an intentionally wrong password. | A generic authentication error is shown; no session is created and the protected page remains inaccessible. One attempt does not accidentally lock the account. |

### 2. Bug Reporting

This is the assumed scenario in the question, not an observed SleekFlow defect. SleekFlow's current password-step button says `Sign in`.

- Bug ID / title: BUG-AUTH-001, Sign in gives no response for a valid account.
- Environment: Example values; use those from the actual reproduction run. Browser: Google Chrome 154 (64-bit). OS: Windows 11 Pro 24H2. Device: Dell Latitude laptop. App build: `index.59352d0e.js`, the hashed entry bundle that app.sleekflow.io served on 9 October 2026, since the page source exposes no version number. Also record the test tenant and SSO configuration.
- Severity: Critical. A user with valid credentials cannot enter the product at all, and the page gives no error or other way forward.
- Priority: P1 if reproducible on the primary login path. Raise to release-blocking priority if all accounts are affected; lower it only after measuring the affected scope and an available workaround.
- Steps to reproduce: 1. Start logged out with an active synthetic account. 2. Open the login page. 3. Enter its valid identifier and continue to the password screen. 4. Enter the valid password. 5. Click `Sign in` once and observe the screen until the normal navigation timeout.
- Expected result: The account authenticates and reaches its protected destination, or a clear error explains why it cannot.
- Actual result: Per the supplied scenario, the page stays on login with no error or apparent action.
- Attachments: A short video captures the click and unchanged page. Before and after screenshots show the form state. Console and network excerpts show whether a request was sent or blocked, with credentials and tokens removed. Attach a request ID if one is available.

### 3. Bug Reporting from a Real Example

Both images show a mobile browser and an open chat widget. The status bar shows a screen-recording timer at 00:00 in the first image and 00:02 in the second, so they appear to be two frames from one recording. The first frame shows the widget header (back arrow, redacted title, and minimize control) above a greeting. In the second, with the keyboard open, neither the header nor the greeting is visible and the conversation area above the composer is empty. A narrow strip of the host page is visible at the right edge. The site URL, versions, device model, and app build are hidden or absent. These are candidate reports pending reproduction, not confirmed production defects.

#### BUG-CHAT-001: greeting disappears from view when the keyboard opens

- Environment: Browser appears to be mobile Chrome, exact version unknown; OS appears to be Android, exact version unknown; phone model unknown; website/widget build unknown. Record these before filing.
- Severity: Major if the opening message becomes inaccessible, since the user loses the context for the chat.
- Priority: P2 pending reproduction. Increase it if it affects most mobile visitors or hides customer replies.
- Steps to reproduce: 1. In portrait mode, open the chat widget. 2. Confirm the greeting is visible. 3. Tap the message field to open the on-screen keyboard. 4. Try to scroll to the greeting without closing the keyboard.
- Expected result: Previous chat messages remain visible or can be reached by scrolling while composing a reply.
- Actual result: In the supplied second frame, the greeting is not visible and the area above the composer appears blank. The composer has moved up by about the height of the keyboard, and the widget header has disappeared as well, which points to the whole panel being pushed up with the greeting above the visible area. The frames alone cannot confirm that the message still exists.
- Attachments: The two supplied frames, with the greeting and empty area marked; a continuous screen recording and an accessibility/DOM snapshot from a reproduction would show whether the message still exists.
- Assumptions and confirmation: Assume the frames show the same session with no reload; the recording timer moving from 00:00 to 00:02 supports this. Reproduce on the same browser and device, scroll the conversation, close and reopen the keyboard, and check whether the greeting returns. With remote debugging from desktop Chrome (`chrome://inspect`), check whether the greeting element is still in the DOM and compare its position with `window.visualViewport`. File the ticket once the behavior and expected design are confirmed.

#### BUG-CHAT-002: host page remains visible around the mobile chat panel

- Environment: Browser appears to be mobile Chrome, version unknown; OS appears to be Android, version unknown; device and website/widget build unknown.
- Severity: Minor if this is a visual gap only. Reassess if touches pass through to the page behind the chat.
- Priority: P3 after confirmation against the mobile design, because a visual gap does not stop anyone from using the chat.
- Steps to reproduce: 1. Open the chat widget in portrait mode. 2. Inspect the right and bottom edges of the panel before and after opening the keyboard. 3. Compare the panel size with the viewport and test whether the exposed strip accepts taps.
- Expected result: If the mobile chat specification requires a full-screen overlay, the panel covers the viewport and the underlying page does not appear beside or below it.
- Actual result: A thin strip of the host page appears along the right edge in both supplied frames. In the second frame, the host page also shows as a beige band between the bottom of the panel and the keyboard. The images do not establish whether that margin is intentional or interactive.
- Attachments: Both frames with the right edge marked, plus the band above the keyboard in the second frame; add a viewport measurement and a screen recording if the gap reproduces.
- Assumptions and confirmation: Check the approved mobile design and other viewport widths. File this as a defect only if the full-screen requirement or an unintended tap-through is confirmed.

#### BUG-CHAT-003: chat header and its controls leave the screen when the keyboard opens

- Environment: Browser appears to be mobile Chrome, version unknown; OS appears to be Android, version unknown; device and website/widget build unknown.
- Severity: Minor if closing the keyboard brings the header back, because the user can recover in one step. Major if the back arrow and minimize control stay out of reach while the chat is open, because the user then has no visible way to leave the chat.
- Priority: P2 pending reproduction. Link it to BUG-CHAT-001, since both symptoms fit the panel being pushed up and one layout fix may resolve both.
- Steps to reproduce: 1. In portrait mode, open the chat widget. 2. Confirm the header shows the back arrow, title, and minimize control. 3. Tap the message field to open the on-screen keyboard. 4. Try to use the back arrow or minimize control without closing the keyboard. 5. Close the keyboard and check whether the header returns.
- Expected result: The header and its controls stay visible and usable while the keyboard is open.
- Actual result: The first frame shows the header with a back arrow, a redacted title, and a minimize control. In the second frame, with the keyboard open, no header is visible, and the message area's gradient starts directly under the browser toolbar.
- Attachments: Both frames with the header area marked; from a reproduction, a screen recording of steps 3 to 5 and the header element's position compared with `window.visualViewport`.
- Assumptions and confirmation: Assume the mobile design does not hide the header on purpose while the user types. Check the widget's mobile design first, then confirm on a device whether the header is off-screen or removed and whether it returns when the keyboard closes. If one cause explains this and BUG-CHAT-001, link the tickets so they are fixed and retested together.

The pale send button with an empty composer could be a normal disabled state. The screenshots do not establish a defect there.

### 4. Handle Requirement Misalignment

To confirm the deviation, first check the current PRD revision, whether the rule applies to password login through this SSO provider, how attempts are counted, and whether a feature flag or another control changes the behavior in this environment. In a sandbox, start with a fresh synthetic account, submit five wrong passwords, then try a sixth attempt and one correct password during the stated lock period. Record timestamps, HTTP statuses, UI messages, and identity-provider or server audit events. If a lock is in place, verify that access returns after the 15-minute window. Avoid repeated lockout testing on a shared account.

Raise the bug only after that short confirmation. The PRD may be outdated, the rule may be disabled in this environment, or another layer such as the identity provider may enforce a lock without showing a message. Once the acceptance criterion and scope are confirmed, raise it promptly with the PRD link and redacted evidence. If the PRD is outdated, still record the mismatch and get a decision instead of silently changing the expected result.

Ask the product owner whether the rule is still required, the identity engineer whether SSO or another layer enforces it, and security for a risk assessment.

An externally exposed password login with no effective throttling or compensating control can justify blocking release. The decision depends on exploitability, affected accounts, existing rate limits or MFA, the release gate, and an explicit risk owner. A cosmetic missing message with effective server-side lockout calls for a different priority.

## Part 3: AI Agent Testing & Test Coverage

### 1. Fundamentals of Testing AI-Powered Features

A login form has a small set of inputs and mostly fixed expected results. An agent can produce different wording for the same request, use tools, and carry context across turns. Test facts and actions against the order system and policy, then assess the response against a rubric. Two different replies are acceptable if both are accurate, authorized, useful, and consistent with the tool results. A factual error, unsafe action, lost instruction, or repeated failure in a required intent is a defect even if the wording sounds plausible. Repeat a case before diagnosing a stochastic failure, but treat any unauthorized action or false transaction claim as an immediate investigation.

Most of this comes from Responsible AI testing I ran on an LLM-based system that evaluates applications, under IMDA's AI Verify framework. A single run proved little there, because the same unchanged input did not always get the same recommendation. Every case therefore ran as a control and probe pair in random order, typically 10 to 30 times, and a difference counted as real only when it held across the pairs. Each pair was compared on what a reviewer would see: the decision, the confidence, the summary and the reasoning for each criterion.

### 2. Designing Test Coverage for an AI Agent

Cover each intent with ordinary, ambiguous, and out-of-scope requests: order status, refund eligibility, cancellation, FAQ, and human handoff. Cross those intents with tool success, known business errors, timeouts, malformed responses, and conflicting or stale knowledge. Add multi-turn context, identity and order ownership, duplicate requests, language variants, privacy, and prompt injection wherever the agent reads text: user messages, retrieved FAQ content, attachments, text inside images, and payloads that are reworded or split across messages. For fairness, send the same request with one attribute changed, such as the customer's name, age, nationality, dialect or language, and count decision flips. Assert both the tool call and the user-facing account of what happened. Test that an agent never claims a state change without a successful tool result.

Version prompts, model identifiers, tool schemas, policy snapshots, and knowledge-base revisions alongside the test results. Replay fixed fixtures and previous incidents for every change. Compare accuracy and action failures by intent and severity with the last accepted version; review a sample of newly generated responses by hand. An exact transcript snapshot is suitable for deterministic tool arguments, not for normal response wording. Keeping a base-model run next to the full-agent run shows which layer moved: a model change can show up in both, while a prompt or guardrail change shows up only in the agent.

### 3. Automating AI Agent Evaluation

Store synthetic cases with an ID, conversation history, frozen tool responses, source policy, and explicit pass conditions. A case can specify `cancel_order` returning `ORDER_ALREADY_SHIPPED` and require that no cancellation or refund success is claimed. Check tool names, arguments, authorization decisions, and resulting state deterministically. For free text, use a narrow rubric for factual grounding, clear error disclosure, and completion of the user's intent. Calibrate any model-based judge against human-labeled examples, inspect borderline cases, and have a person adjudicate every run it flags; simple keyword checks miss negation. For personal data, plant invented identifiers in the input, search every output for them and read each hit, because a plain match also flags a reply that quotes an identifier while refusing to use it. Set every pass condition before the run and size it to the risk, as IMDA's Starter Kit for testing LLM-based applications advises. The bars I used were zero for high-stakes failures such as a followed injection or a leaked identifier, zero decision flips plus the four-fifths rule across groups for fairness, and 98 of 100 runs for consistency.

Run fast contract cases on changes to code, prompts, tools, or the knowledge base. Run repeated samples and broader adversarial cases nightly and before release. Record per-case outcomes across runs, along with latency and tool errors. A single critical action failure opens an investigation; for variable low-risk wording, compare failure rates across repeated runs and inspect the unstable cases. Keep case IDs and expected behaviors in version control, update them when a documented policy changes, and retain past incident cases unless their underlying behavior is explicitly retired. Use only synthetic people, orders, and account data. Store each input with a SHA-256 checksum and keep the raw run records, so a number in a later report can be traced to the exact input and output behind it. Writing the sets in an existing format, such as IMDA Moonshot's dataset format, keeps them comparable with public tooling.

### 4. Quality, Safety, and Shipping Decisions

Test unauthorized order access, fabricated policies, false transaction confirmations, disclosure of personal data, repeated tool calls, missed escalation, unsafe instructions, and cost or latency spikes. Put malicious instructions in user messages and in lower-trust FAQ or retrieved text, such as a forged request to ignore the system policy or reveal another customer's order. Assert that server authorization rejects forbidden tool calls regardless of the agent's wording. Check the agent's explanation and handoff behavior after the rejection. Run the same attacks against the base model with a bare prompt and through the full agent, because the two can disagree. When a filter removes the carrier before the model reads it, the run shows that the system held, and it says nothing about whether the model resists the instruction, so record it as filtered rather than resisted. Test the side effects of the defenses too: a filter that withholds a whole document to stop an instruction inside it also drops the legitimate content around it, and a backend failure that the API keeps reporting as still processing leaves the user waiting with no error.

A 94% pass rate does not answer the release question when the failing 6% changes between runs. Identify which cases fail, their severity, how many times each was sampled, the baseline rate, and whether tool or test infrastructure caused failures. Rerun with fixed versions and review the critical failures individually. The run count matters as much as the rate: zero failures in 20 runs still allows a true failure rate up to 13.9% at 95% confidence (the rule of three gives 3/20, or 15%), and 60 clean runs bring it under 4.9%. A case whose threshold or run count is not settled stays provisional and does not count as a pass. Require zero known false transaction confirmations and unauthorized actions. A release can proceed only when the remaining failures meet agreed thresholds by risk category and the product and security owners accept the documented residual risk.

### 5. Applied: Reviewing an AI Agent Conversation

1. Turn 2 asserts a 30-day cancellation policy and says this order qualifies without checking a policy source or purchase date. The tool already said the order was in transit. The customer may rely on an unsupported refund promise.
2. Turn 3 ignores `ORDER_ALREADY_SHIPPED` and tells the customer the order was cancelled. The order is still in transit according to the only tool result shown.
3. Turn 3 also claims a refund was processed and gives a 3 to 5 business day timeline. No successful refund tool call or payment event is present, so the customer may wait for money that was never sent.
4. Turn 4 asks for an order number already supplied in turn 1 and used in a tool call. It could have repeated the known ETA for A-4471, while making clear it was an estimate rather than a confirmed delivery date.
5. Turn 5 ignores the explicit request for a person. It should initiate a supported handoff or explain how to reach one if transfer is unavailable.

The log has no conversation timestamp. The customer's turn 2 reply, "That's way too late", suggests the 9 September 2026 ETA was still ahead when the chat took place, so the ETA itself is not listed as an issue. The trace does not show whether the backend checks order ownership, so authorization needs a separate test rather than an unproven finding here.

#### BUG-AGENT-001: false cancellation and refund after tool rejection

- Environment: Support-agent channel and device not supplied; browser and version not supplied or not applicable to the agent runtime; OS/runtime version, model, prompt revision, tool version, and build/version not supplied. Capture these from the test run before filing.
- Severity: Critical. The customer receives a false confirmation about an order and a payment outcome.
- Priority: P0 for a live release because the agent may cause financial disputes and delay corrective support. Reassess scope and mitigation immediately if found in a test build.
- Steps to reproduce: 1. Use the supplied synthetic order A-4471. 2. Mock `get_order_status` to return `in_transit` with ETA `2026-09-09`. 3. Ask to cancel and refund it. 4. Mock `cancel_order` to return `ORDER_ALREADY_SHIPPED`. 5. Read the agent's reply and inspect the order and refund audit events.
- Expected result: The agent explains that cancellation failed, does not claim a refund, and offers an eligible next step or a human handoff.
- Actual result: The supplied log says the order was cancelled and a refund processed despite the explicit cancellation error; it also promises payment within 3 to 5 business days.
- Attachments: Redacted transcript, ordered tool-call trace with the error response, prompt/model/build identifiers, and order/refund audit evidence showing the final state. The log itself shows no successful refund call; verify the backend state before asserting that no other service initiated one.

To catch these failures before release, replay this five-turn case with frozen tool responses. Assert that the cancellation call receives the specified error and the order state remains `in_transit`; classify the agent's response as an unsuccessful cancellation, with no refund-completed claim. Add a case with missing purchase date to prevent an eligibility promise, a follow-up asking for the prior ETA to check conversation memory, and a request for a person to check handoff. Run the critical transaction cases often enough for a clean result to bound the failure rate, and block on any false success claim. Keep server-side tool authorization and order-state checks independent of the language model.
