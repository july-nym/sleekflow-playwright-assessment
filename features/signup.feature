@smoke
Feature: Sign up
  Visitors sign up on the hosted form with an email address and a terms checkbox.
  No scenario here creates an account. The one that submits the form gets its request
  answered inside the browser.

  Background:
    Given I open the signup form

  Scenario: Consent starts unchecked and the policy links are shown
    Then the terms checkbox is not checked
    And the Terms of Service and Privacy Policy links are visible

  Scenario: An empty email is rejected
    When I submit the signup form
    Then the email field shows the error "Please enter an email address"
    And the signup form stays on the email step

  Scenario: A malformed email is rejected
    When I enter the email "not-an-email"
    And I submit the signup form
    Then the email field shows the error "Email is not valid."
    And the signup form stays on the email step

  Scenario: A consented signup is caught before it reaches SleekFlow
    Given signup requests are intercepted in the browser
    When I enter the email "qa-signup@example.com"
    And I accept the terms
    And I submit the signup form
    Then the intercepted request has the email "qa-signup@example.com"
    And the intercepted request records consent to the terms
