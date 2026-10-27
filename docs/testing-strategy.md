# Testing Strategy — Mie Sukses Creative Marketplace

**Status:** Draft for review  
**Scope:** Frontend, backend, database, security, integration, and end-to-end testing.

## 1. Testing Goals

Testing must verify that:

1. Features behave according to the approved requirements.
2. Business rules are enforced by trusted backend logic.
3. Users cannot access data or operations outside their permissions.
4. Database constraints preserve data integrity.
5. Critical multi-step operations are atomic.
6. Checkout retries do not create duplicate orders.
7. Frontend states accurately reflect backend results.
8. The project can be installed, tested, and built reproducibly.
9. Local development does not depend on an unapproved remote service.
10. Reported test results reflect commands that were actually executed.

A successful build alone is not proof that the application works correctly.

## 2. Testing Principles

- Test business behavior, not only implementation details.
- Prioritize security, checkout integrity, role management, and order transitions.
- Test both successful operations and expected failures.
- Use isolated test data.
- Avoid dependence on production data or a developer's personal account.
- Keep tests repeatable.
- Never use real payment credentials or perform real payments in tests.
- Never run destructive test operations against a production database.
- Do not access or modify a remote Supabase project during local tests unless the user explicitly approves that operation.
- Do not mark unexecuted tests as passing.

## 3. Testing Layers

### 3.1 Static analysis and formatting

Use the configured tools to check:

- TypeScript errors.
- Lint violations.
- Formatting violations where a formatter is configured.
- Invalid imports and unused code where supported.
- Frontend and backend build errors.

Markdown linting may be used for documentation consistency, but documentation linting is separate from application testing.

### 3.2 Unit tests

Unit tests verify isolated functions and business rules.

Examples:

- Input validation.
- IDR formatting.
- Price snapshot calculations.
- Role and permission decisions.
- Allowed order-state transitions.
- Checkout request validation.
- Idempotency-key validation.
- Media metadata validation.
- Mapping internal errors to documented API errors.

Unit tests should avoid external network calls and should not require a live Supabase project.

### 3.3 Database tests

Database tests use an isolated local PostgreSQL test database.

Verify:

- Foreign-key constraints.
- Unique constraints.
- Check constraints.
- Index-dependent query behavior where relevant.
- Ownership relationships.
- Transaction rollback.
- Atomic creation of checkout batches, orders, and order events.
- Cart clearing only after successful checkout.
- Role and application consistency.
- Protection of historical order snapshots.
- Last-active-admin protection.
- Concurrent operations where races could violate business rules.

A test database must be clearly separated from development data.

### 3.4 Backend unit and integration tests

Backend tests verify:

- Request validation.
- Authentication and session handling.
- Account-status enforcement.
- Role-based authorization.
- Resource ownership.
- API response contracts.
- Expected error codes.
- Database transaction boundaries.
- Storage adapter behavior.
- Safe handling of unexpected failures.

Integration tests should exercise the actual backend and local database together where practical.

Mocks may be used for external services, but a mocked test must not be described as proof that the real external service integration works.

### 3.5 Frontend component tests

Use Vitest and React Testing Library for relevant UI behavior.

Verify:

- Form labels and validation.
- Loading and disabled states.
- Error and success feedback.
- Service-card rendering.
- Search and category filtering.
- Cart interactions.
- Order status display.
- Role-dependent navigation.
- Accessible dialog behavior.
- Prevention of duplicate submissions while a request is pending.

Tests should prefer observable user behavior over internal component implementation details.

### 3.6 End-to-end tests

Use Playwright for the most important complete user journeys when the local environment supports them.

The test environment must use test accounts, test data, a local backend, and an isolated test database.

Do not run E2E tests against production by default.

## 4. Test Environment

The intended local test environment consists of:

- Node.js and npm.
- The frontend test runner.
- The backend test runner.
- Local PostgreSQL.
- A dedicated test database.
- Test-only environment variables.
- Deterministic seed data.
- Local or mocked media storage as appropriate.

The exact package scripts and configuration must be defined after the application structure is confirmed.

Tests must not require valid production credentials.

If a test requires a service that has not been implemented, report it as blocked or not implemented rather than silently skipping the limitation.

## 5. Test Data and Isolation

Test data must be generated or seeded deliberately.

Use distinct test identities for:

- Unauthenticated visitor.
- Active buyer.
- Approved seller.
- Seller applicant awaiting review.
- Rejected seller applicant.
- Suspended or deactivated user.
- Active administrator.
- Any additional administrator required for last-admin protection tests.

Create services with distinct owners and statuses.

Create orders in each relevant state.

Rules:

- Never rely on a specific row ID remaining unchanged across test runs.
- Avoid real personal information.
- Do not store production passwords in test fixtures.
- Do not share test accounts with production.
- Clean up test data safely when cleanup is required.
- Use transaction rollback or disposable test databases where appropriate.

## 6. Authentication and Authorization Tests

Verify the following:

1. Unauthenticated users cannot access protected operations.
2. Invalid or expired sessions are rejected.
3. Deactivated accounts cannot perform protected actions.
4. Buyers cannot execute seller-only operations.
5. Sellers cannot execute admin-only operations.
6. Users cannot change their own role through profile updates.
7. Users cannot read another user's private profile.
8. Buyers cannot read another buyer's cart or orders.
9. Sellers cannot edit services owned by another seller.
10. Sellers cannot read unrelated sellers' private orders.
11. Ordinary users cannot write moderation or role-audit records.
12. Unauthorized users cannot retrieve private media.
13. Public endpoints expose only approved public fields.

Where local and production adapters differ, test their shared authorization rules independently.

## 7. Catalog and Service Tests

Verify:

- Only eligible published services appear in the public catalog.
- Draft services are not publicly orderable.
- Suspended services are not publicly orderable.
- Archived services are not publicly orderable.
- Search returns appropriate matches.
- Category filtering uses the documented category identifiers.
- Invalid categories are handled consistently.
- Service title and description constraints are enforced.
- Price must be a positive integer IDR amount.
- A service cannot be published without required data and a valid thumbnail.
- Sellers can edit their own services but not another seller's services.
- A service's owner cannot be changed through ordinary editing.
- Seller suspension or deactivation prevents new orders according to the approved policy.

## 8. Seller Application Tests

Verify:

- Valid applications can be submitted.
- Invalid reason lengths are rejected.
- Invalid portfolio URLs are rejected.
- A second pending application is rejected.
- Applicants cannot approve their own applications.
- Unauthorized users cannot review applications.
- Already-reviewed applications cannot be reviewed again.
- Approval and role assignment succeed atomically.
- Failed approval leaves consistent application and role state.
- Rejection preserves the review result.
- Reapplication behavior matches the final approved policy.

## 9. Cart Tests

Verify:

- Only an authenticated buyer can manage their own cart.
- Adding an available service creates a cart item.
- Adding the same service twice does not create a duplicate.
- A cart may contain services from multiple sellers.
- Quantity is always one.
- Quantity update operations are not exposed.
- Removing an item affects only the intended cart item.
- Unavailable services cannot be added or checked out.
- A buyer cannot purchase their own service.
- Cart access does not expose another buyer's data.

## 10. Checkout and Idempotency Tests

Checkout is a critical workflow and requires both ordinary and failure-path testing.

Verify:

1. Empty carts cannot be checked out.
2. Valid carts produce one order per cart item.
3. Every created order has quantity one.
4. Prices come from trusted database values.
5. The buyer cannot submit a forged price or seller identity.
6. Each order records the required immutable snapshots.
7. Each order starts in `pending`.
8. Each order receives an initial order event.
9. The checkout batch, orders, order events, and cart clearing are atomic.
10. A failed transaction does not leave partial orders.
11. A failed checkout does not clear the cart.
12. A successful checkout clears only the intended purchased items.
13. Retrying the same logical request does not create duplicate orders.
14. Reusing an idempotency key follows the documented conflict or replay behavior.
15. Concurrent checkout attempts do not double-purchase the same cart contents.
16. A service that becomes unavailable during checkout causes a safe failure.
17. A price change before checkout uses the authoritative price defined by the approved checkout policy.

The idempotency request shape and fingerprint rules must be finalized consistently in `api-contract.md` and `database-contract.md` before these tests are implemented.

Tests must cover the actual concurrency and transaction strategy rather than only checking a mocked response.

## 11. Order Lifecycle Tests

Verify:

- New orders start as `pending`.
- Only the assigned seller may accept or reject a pending order.
- Only the assigned seller may move an accepted order to `in_progress`.
- Invalid transitions are rejected.
- Buyers cannot modify orders belonging to other buyers.
- Sellers cannot modify orders assigned to other sellers.
- Order status changes and corresponding order events are atomic.
- Historical events cannot be rewritten through ordinary application operations.
- Admin cancellation follows the final approved transition policy.
- Buyer completion follows the final approved transition policy.
- Account deactivation behavior with active orders follows the final approved policy.

Do not implement or test a provisional transition as a final product rule without recording its status.

## 12. Media and Storage Tests

Verify:

- Unsupported file formats are rejected.
- Invalid or spoofed file content is rejected.
- File size limits are enforced.
- Image dimensions are validated where required.
- Users cannot upload to another user's resource.
- Users cannot overwrite unrelated media.
- Published thumbnails follow the approved public-access policy.
- Private media cannot be retrieved without authorization.
- Suspended and archived service media follow the approved visibility rules.
- Deleting a media record does not grant access to another file.
- Cleanup can be retried safely after partial failure.

Mocked storage tests and real local-storage integration tests must be clearly distinguished in test reports.

## 13. Administrative and Audit Tests

Verify:

- Only authorized administrators can review applications.
- Only authorized administrators can perform moderation.
- Role changes are recorded.
- Moderation changes are recorded.
- Audit records identify the actor, target, action, and timestamp.
- Ordinary users cannot alter audit history.
- Failed administrative operations do not create misleading success records.
- Application approval and role assignment remain consistent.
- The last active administrator cannot be removed or demoted.
- Self-promotion is rejected.

Concurrency tests must be considered for operations where simultaneous admin changes could violate the last-admin rule.

## 14. Frontend and Accessibility Tests

Verify:

- Pages display loading, empty, error, and success states appropriately.
- Form validation messages are understandable.
- Controls have accessible names.
- Keyboard navigation works for essential flows.
- Focus indicators are visible.
- Dialogs manage focus correctly.
- Status is not communicated through color alone.
- Responsive layouts do not create unintended horizontal overflow.
- Checkout displays simulated-payment messaging accurately.
- UI actions reflect backend authorization and state.
- Frontend totals are not treated as authoritative checkout totals.

Test representative viewport widths of approximately 360px, 390px, 768px, 1024px, and 1440px.

## 15. Core End-to-End Scenarios

The following scenarios should be automated where practical.

### Scenario A — Buyer order journey

1. Register or authenticate a buyer.
2. Browse the service catalog.
3. Search or filter services.
4. Open a service detail page.
5. Add the service to the cart.
6. Review the cart.
7. Check out.
8. Confirm the order is created.
9. Confirm the cart is cleared after success.
10. Open order history and view the new order.

### Scenario B — Seller onboarding and publishing

1. Authenticate a buyer.
2. Submit a valid seller application.
3. Confirm the application is pending.
4. Authenticate an administrator.
5. Approve the application.
6. Confirm seller permissions are assigned.
7. Authenticate the seller.
8. Create a service draft.
9. Upload a valid thumbnail.
10. Publish the service.
11. Confirm that the service appears in public browsing.

### Scenario C — Seller order processing

1. Create an order for an eligible seller.
2. Authenticate the assigned seller.
3. Accept the order.
4. Move it to `in_progress`.
5. Verify the order status and event history.
6. Test completion only after the buyer-completion policy is approved.

### Scenario D — Authorization denial

1. Authenticate one buyer.
2. Attempt to retrieve another buyer's order.
3. Confirm access is denied without leaking private data.
4. Attempt a seller-only operation.
5. Confirm access is denied.
6. Attempt an administrative operation.
7. Confirm access is denied.

### Scenario E — Checkout failure and retry

1. Prepare a valid cart.
2. Trigger a controlled checkout failure.
3. Confirm no partial orders remain.
4. Confirm the cart remains intact.
5. Retry according to the documented idempotency contract.
6. Confirm the final state contains no duplicate orders.

### Scenario F — Administrative auditability

1. Authenticate an administrator.
2. Review an application or moderate a service.
3. Confirm the intended state change.
4. Confirm the associated audit event.
5. Confirm an ordinary user cannot alter the audit record.

## 16. Build and Release Checks

Before a release candidate is approved, run the applicable checks:

- Dependency installation from the lockfile.
- Type checking.
- Linting.
- Unit tests.
- Backend integration tests.
- Database tests.
- Frontend component tests.
- End-to-end tests where configured.
- Production frontend build.
- Production backend build or startup verification.
- Migration validation against a disposable test database.
- Secret and environment-configuration review.

The exact commands must be documented in the root README and package scripts after implementation.

## 17. Failure Reporting

Every test report must distinguish:

- **Passed:** executed and passed.
- **Failed:** executed and failed.
- **Blocked:** could not execute because a required dependency or setup step was unavailable.
- **Not run:** not executed.
- **Not implemented:** the relevant feature or test does not exist yet.

When a test fails:

1. Preserve the error output.
2. Identify the failing layer.
3. Determine whether the cause is the code, environment, configuration, or test itself.
4. Fix the root cause.
5. Rerun the affected test.
6. Run relevant regression tests.
7. Report the actual result.

Do not suppress failures merely to obtain a green test summary.

## 18. Test Commands and Automation

The final project must expose documented commands for common checks, such as:

- Run frontend unit tests.
- Run backend unit and integration tests.
- Run database tests.
- Run end-to-end tests.
- Run type checking.
- Run linting.
- Build the frontend.
- Build or verify the backend.

These are required capabilities, not claims that the commands or scripts already exist.

Do not invent successful command output.

## 19. Completion Criteria

A feature is ready for acceptance only when:

1. Its requirements and contracts are defined.
2. Its implementation exists.
3. Applicable tests have been written.
4. Tests have actually been executed.
5. Critical authorization and data-integrity cases pass.
6. Relevant regression tests pass.
7. The build and static checks pass.
8. Known limitations are documented.
9. The implementation report distinguishes verified results from assumptions.

The MVP must not be described as fully tested merely because it compiles or renders.

## 20. Safety Boundary

All default tests must use local resources, disposable test data, and safe test credentials.

No test may silently:

- Connect to the previous Supabase project.
- Execute SQL against a remote database.
- Apply remote migrations.
- Modify remote storage policies.
- Delete or overwrite remote resources.
- Deploy the application.

Remote testing or deployment requires explicit user approval and a separately documented plan.
