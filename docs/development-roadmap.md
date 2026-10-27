# Development Roadmap — Mie Sukses Creative Marketplace

**Status:** Draft for review  
**Development strategy:** Local-first, contract-driven, incremental implementation.

## 1. Objective

Build a functional student creative-services marketplace with a maintainable architecture, tested business rules, and a professional responsive interface.

The implementation must follow the approved requirements, architecture, database contract, API contract, security policy, UI/UX specification, testing strategy, migration plan, and deployment plan.

This roadmap defines the intended sequence. It does not claim that any phase has been implemented or tested.

## 2. Development Rules

1. Complete the documentation audit before feature implementation.
2. Resolve contradictions before coding affected functionality.
3. Work in small, reviewable stages.
4. Keep the application runnable throughout development where practical.
5. Test each stage before starting dependent work.
6. Use local PostgreSQL as the initial database.
7. Keep database migrations version-controlled.
8. Do not introduce unapproved remote dependencies.
9. Do not deploy or modify remote infrastructure without explicit approval.
10. Do not replace working code merely to match personal stylistic preferences.
11. Do not claim tests pass unless they were executed.
12. Report changed files, commands run, results, and known limitations after each stage.

## 3. Phase Overview

| Phase | Scope | Completion gate |
| --- | --- | --- |
| 0 | Documentation audit | Contracts are consistent and open decisions are recorded |
| 1 | Project foundation | Frontend, backend, shared types, and local tooling run |
| 2 | Database foundation | Local PostgreSQL schema and migrations are reproducible |
| 3 | Authentication and profiles | Session handling and account permissions work |
| 4 | Catalog and seller onboarding | Applications, categories, services, and catalog work |
| 5 | Media handling | Upload validation and access controls work |
| 6 | Cart and checkout | Atomic checkout and idempotency tests pass |
| 7 | Orders and audit history | Approved order transitions and event history work |
| 8 | Frontend integration | Main user journeys work through the actual API |
| 9 | Administration and hardening | Moderation, security, and regression tests pass |
| 10 | Release preparation | Build, documentation, and deployment checks are complete |

Do not skip a phase's completion gate merely to reach later features faster.

## 4. Phase 0 — Documentation Audit

Read all project documentation before implementation.

Review:

- `docs/semua.md`
- `docs/architecture.md`
- `docs/requirements.md`
- `docs/database-contract.md`
- `docs/api-contract.md`
- `docs/security.md`
- `docs/ui-ux-specification.md`
- `docs/testing-strategy.md`
- `docs/migration-plan.md`
- `docs/deployment.md`
- `docs/development-roadmap.md`

Identify contradictions, missing decisions, duplicated rules, undefined API payloads, missing schema constraints, and mismatched test expectations.

At minimum, resolve or explicitly defer:

- Local authentication and session storage.
- Database driver and migration tooling.
- Media storage adapter and upload limits.
- Checkout idempotency and retry semantics.
- Order completion and cancellation rules.
- Seller reapplication after rejection.
- Administrator eligibility and last-admin protection.
- Account deactivation with active orders.
- Production authentication and storage integration.
- Deployment provider selection.

**Gate:** Produce a concise audit report. Do not implement application features during this phase.

## 5. Phase 1 — Project Foundation

Create the project structure defined by the approved architecture.

Expected outcomes:

- React, TypeScript, and Vite frontend.
- Node.js, TypeScript, and Express backend.
- Shared schemas and types where appropriate.
- Root development scripts.
- Environment-variable validation.
- `.env.example` without secrets.
- `.gitignore`.
- Basic logging and error handling.
- Health endpoint.
- Linting, type checking, and test configuration.
- README with reproducible setup instructions.

Verify that frontend and backend can start independently and that their health and development workflows are documented.

**Gate:** Fresh dependency installation, static checks, and initial builds succeed.

## 6. Phase 2 — Database Foundation

Set up local PostgreSQL and the selected migration mechanism.

Implement:

- Migration history.
- Profiles and required account relationships.
- Seller applications and administrator access requests.
- Categories and services.
- Media metadata.
- Carts and cart items.
- Checkout batches.
- Orders and order events.
- Moderation and role audit events.
- Foreign keys, unique constraints, check constraints, and indexes.

Use only approved schema decisions.

Create synthetic development seeds for the four catalog categories and relevant test accounts.

Verify that the schema can be recreated from an empty test database using the committed migrations.

**Gate:** Migration tests, database constraints, and relevant integration tests pass.

## 7. Phase 3 — Authentication and Profiles

Implement the approved local authentication adapter.

Build:

- Registration.
- Login.
- Logout.
- Current-session retrieval.
- Session expiration and revocation.
- Profile retrieval and updates.
- Public seller profile.
- Account deactivation.
- Role and account-status enforcement.

Use a proven password-hashing implementation if the application manages passwords itself.

Do not store plaintext passwords or treat frontend state as proof of authorization.

**Gate:** Authentication, session, account-status, privacy, and role-boundary tests pass.

## 8. Phase 4 — Seller Onboarding and Catalog

Implement:

- Seller application submission.
- Application status retrieval.
- Administrative application review.
- Approved category listing.
- Service creation and editing.
- Draft and published service states.
- Service detail.
- Search and category filtering.
- Service ownership checks.
- Publishing validation.

Use the exact category identifiers from the database contract.

**Gate:** Catalog visibility, seller ownership, application workflow, and publishing tests pass.

## 9. Phase 5 — Media Handling

Implement the approved storage adapter and media access policy.

Build:

- Avatar upload.
- Service thumbnail upload.
- Portfolio image upload.
- File type and size validation.
- Authorization checks.
- Safe file naming.
- Replacement and deletion behavior.
- Orphan cleanup where required.

Do not rely on temporary hosting filesystems for persistent production media.

**Gate:** Upload validation, ownership, visibility, and unauthorized-access tests pass.

## 10. Phase 6 — Cart and Checkout

Implement:

- Active cart retrieval.
- Add service.
- Remove service.
- Multi-seller cart support.
- Checkout request validation.
- Server-side price retrieval.
- Immutable order snapshots.
- Checkout batch creation.
- One order per cart item.
- Initial order events.
- Atomic cart clearing.
- Idempotency and retry handling.

Use database transactions and concurrency controls appropriate to the approved checkout contract.

Never trust client-submitted prices, seller IDs, or order totals.

**Gate:** Checkout success, rollback, concurrent requests, stale cart state, and idempotency tests pass without duplicate or partial orders.

## 11. Phase 7 — Orders and Audit History

Implement the final approved order state machine.

Build:

- Buyer order history.
- Seller order list.
- Order detail.
- Authorized status transitions.
- Order event history.
- Administrative cancellation if approved.
- Moderation history.
- Role-change audit history.

Do not implement provisional order transitions until the policy is approved.

**Gate:** Valid transitions succeed, invalid transitions fail, ownership restrictions hold, and state changes remain consistent with their audit events.

## 12. Phase 8 — Frontend Integration

Connect the UI to the actual backend API.

Complete the primary pages:

- Public landing page.
- Catalog and search.
- Service detail.
- Registration and login.
- Buyer profile.
- Seller application and dashboard.
- Service editor.
- Cart.
- Simulated checkout.
- Buyer order history.
- Seller order management.
- Administrative dashboard.

Implement loading, empty, error, success, and unauthorized states.

Follow the approved visual system, responsive behavior, accessibility requirements, and UI/UX specification.

The interface must not display fake reviews, unsupported payment capabilities, or fabricated business data.

**Gate:** Core end-to-end user journeys work against the local backend and test database.

## 13. Phase 9 — Administration and Security Hardening

Complete administrative functions and security checks.

Verify:

- Application review.
- Service moderation.
- User and role management where approved.
- Last-administrator protection.
- Audit record integrity.
- Request validation.
- Rate limiting.
- CORS and session configuration.
- Private media access.
- Sensitive-data handling.
- Error responses without secret leakage.

Review the entire API for missing ownership checks and unauthorized state transitions.

**Gate:** Security tests and critical regression tests pass.

## 14. Phase 10 — Release Preparation

Prepare the project for review and possible deployment.

Complete:

- Production builds.
- Test suite.
- Environment documentation.
- Database migration instructions.
- Local setup instructions.
- API documentation.
- Known limitations.
- Git repository cleanup.
- Deployment provider verification.
- Production configuration review.
- Smoke-test plan.

Deployment must remain a separate approved action.

**Gate:** The project is reproducible from documented instructions, critical tests have actual recorded results, and remaining limitations are explicit.

## 15. Priority Order

If time is limited, prioritize:

1. A reproducible local development environment.
2. Authentication and authorization.
3. Catalog and service management.
4. Cart and atomic checkout.
5. Order history and lifecycle.
6. Required administration.
7. Responsive and polished frontend.
8. Additional enhancements.

Do not sacrifice authorization or checkout integrity to add decorative UI features.

## 16. Change Control

When requirements change:

1. Identify the affected requirement.
2. Update the relevant contract.
3. Identify downstream schema, API, UI, and test impacts.
4. Review existing data compatibility.
5. Update tests.
6. Implement the change.
7. Run relevant regression tests.
8. Record the change in the implementation report.

Do not silently change a documented business rule in code alone.

## 17. Progress Reporting

After each phase, report:

- Phase and objective.
- Files created or modified.
- Behavior implemented.
- Commands actually executed.
- Tests passed and failed.
- Tests blocked or not run.
- Known limitations.
- Decisions requiring user input.
- Recommended next step.

Distinguish implemented, tested, and verified behavior from assumptions.

## 18. Stop Conditions

Stop and report before proceeding if:

- Documentation conflicts affect the current implementation.
- A business rule is undefined and materially affects data integrity.
- A migration could destroy or invalidate important data.
- A remote resource is required but not approved.
- Credentials or required configuration are unavailable.
- Tests reveal a security or transaction-integrity problem.
- A proposed change substantially expands scope.

Do not invent missing requirements just to keep implementation moving.

## 19. Final Completion Criteria

The MVP is ready for acceptance when:

- All required features are implemented.
- Business rules are enforced by the backend.
- Core user journeys work.
- Critical security and checkout tests pass.
- The schema is reproducible from migrations.
- The UI is responsive and usable.
- Setup and testing instructions are accurate.
- Known limitations are documented.
- The Git repository is reviewable.
- Any deployment has been separately approved and verified.

A successful build alone does not mean the MVP is complete.

## 20. Remote Operation Boundary

Local implementation and testing are the default.

Do not connect to, migrate, modify, deploy to, or delete remote resources unless the user explicitly approves the specific operation.

Never assume that a previously used Supabase project is the correct project for this workspace.
