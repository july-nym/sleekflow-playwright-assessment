Feature: Log in
  Returning users enter an email or username, continue to the password step and sign in.
  The @auth scenarios need a test account. They are skipped unless SLEEKFLOW_TEST_EMAIL,
  SLEEKFLOW_TEST_PASSWORD and SLEEKFLOW_RUN_AUTH_TESTS=1 are set.

  @smoke
  Scenario: An empty identifier is rejected
    Given I open the login form
    When I continue without an identifier
    Then the identifier field shows the error "Email address or username is required"
    And the login form stays on the identifier step

  @smoke
  Scenario: An empty password is rejected
    Given I am on the password step as "qa-sleekflow-check@example.com"
    When I sign in without a password
    Then the password field shows the error "Password is required"
    And the login form stays on the password step

  @auth
  Scenario: A wrong password shows a generic error
    Given I am on the password step with the test account
    When I sign in with the password "ClearlyWrongPassword#2026"
    Then the error "Wrong username or password" is shown
    And the login form stays on the password step

  @auth
  Scenario: The test account reaches the app
    Given I am on the password step with the test account
    When I sign in with the test account password
    Then the SleekFlow app opens
