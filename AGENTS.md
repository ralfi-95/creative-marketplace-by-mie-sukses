# AGENTS.md — Mie Sukses Creative Marketplace

## 1. Project Mission

Build a maintainable, secure, responsive student creative-services marketplace called **Mie Sukses Creative Marketplace**.

The product connects buyers with sellers offering creative services, including video and photo editing, photography, graphic design, and UI/UX design.

The implementation must follow the project's approved documentation, preserve data integrity, and remain reproducible in a local development environment.

## 2. Mandatory First Action

**Before modifying application code, inspect the existing workspace and audit the available documentation.**

Read the following files if they exist:

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

Do not assume a listed file exists. Inspect the actual workspace.

If a required file is missing, report its path and explain which decisions cannot yet be verified. Do not invent its contents or pretend it was read.

Also inspect:

- Existing source code.
- Package manifests and lockfiles.
- Existing tests.
- Database and migration files.
- Environment examples.
- Git status and current project structure.

Do not overwrite existing work merely because it differs from an example directory tree.

## 3. Initial Task: Documentation Audit Only

The first task is a **read-only documentation and workspace audit**.

During this task:

1. Compare requirements against architecture.
2. Compare the database schema against the API contract.
3. Compare API behavior against security requirements.
4. Compare UI flows against supported backend operations.
5. Compare test requirements against documented business rules.
6. Check migration and deployment assumptions.
7. Identify missing decisions, contradictions, duplicated rules, and implementation risks.
8. Recommend the smallest set of corrections needed before implementation.

Produce an audit report containing:

- Files actually inspected.
- Missing documentation.
- Contradictions and their locations.
- Decisions that require user approval.
- Proposed corrections.
- Recommended implementation order.

Do not implement features, create database migrations, install dependencies, reset databases, or deploy anything during this initial audit.

If a documentation correction is necessary, report the exact change and request approval before making broad or consequential changes. Small, explicitly requested documentation corrections may be applied within their stated scope.

## 4. Source-of-Truth Hierarchy

Use the following hierarchy:

1. Explicit, current user instructions.
2. Business rules explicitly approved by the user.
3. The relevant project contract documents.
4. The approved architecture and development roadmap.
5. Existing implementation, when compatible with the approved contracts.
6. General engineering conventions.

Existing code is not automatically correct merely because it already exists.

Examples and proposed rules marked as drafts are not approved requirements.

If authoritative sources conflict, stop and report the conflict. Do not silently choose a behavior that changes business rules, data integrity, authorization, or API compatibility.

## 5. Technology Boundaries

The intended architecture is:

- Frontend: React, TypeScript, and Vite.
- Backend: Node.js, TypeScript, and Express.
- Database: PostgreSQL.
- API: JSON over HTTP.
- Tests: appropriate unit, integration, component, and end-to-end tools defined by the project.

Confirm actual dependencies and configuration before changing them.

Prefer a small, understandable architecture with clear module boundaries.

Do not introduce a second framework, competing ORM, redundant state-management library, or unnecessary service layer without a concrete justification.

Keep frontend rendering separate from trusted business logic.

The frontend must never be the authority for prices, permissions, seller eligibility, checkout totals, or order-state transitions.

## 6. Local-First Development

Local development is the default.

Use local PostgreSQL and version-controlled migrations as defined by the approved database and migration contracts.

Before executing a database command, identify the target environment.

Never assume that a connection URL, migration directory, project identifier, or environment variable points to the intended database.

Do not silently switch from local PostgreSQL to a remote database.

Do not assume that local PostgreSQL provides Supabase Auth, Supabase Storage, or Supabase-specific APIs.

Any provider-specific integration must have an explicit adapter and documented configuration.

## 7. Strict Remote and Supabase Boundary

**No remote operation is authorized by this file alone.**

Without explicit user approval for the specific operation, do not:

- Connect to a remote Supabase project.
- Execute SQL against a remote database.
- Apply or repair remote migrations.
- Reset or delete a remote project.
- Modify remote tables, policies, roles, or database settings.
- Upload, overwrite, or delete remote storage objects.
- Change authentication-provider configuration.
- Deploy the application.
- Enable paid services or create billable resources.

Do not reuse credentials, project identifiers, environment files, or migration history from a previous Supabase project by assumption.

Never expose secrets in source code, logs, reports, browser bundles, or Git commits.

If a requested task requires a remote operation, explain the exact target, intended change, and risk, then wait for approval.

A generic request to continue development is not approval for destructive or billable cloud operations.

## 8. Database and Migration Rules

Before changing the schema:

1. Read the database contract.
2. Read the migration plan.
3. Inspect existing migrations and schema state.
4. Identify the database target.
5. Check dependent API behavior and tests.
6. Prepare a reviewable migration.
7. Test it against a disposable local PostgreSQL database.
8. Report the actual test results.

Preserve foreign keys, uniqueness, constraints, order snapshots, and audit history.

Use transactions for multi-step operations where supported.

Do not assume every migration is reversible.

Do not edit an already-applied migration to disguise schema drift. Propose a new corrective migration when appropriate.

Never run destructive database commands against an ambiguous target.

## 9. Security Requirements

Enforce authorization on the backend for every protected operation.

Verify:

- Authentication and session validity.
- Account status.
- Role permissions.
- Resource ownership.
- Input validation.
- Database transaction integrity.
- Safe media access.
- Error handling without secret leakage.
- Audit-event integrity.
- Rate limiting where required.

Never trust user-submitted prices, roles, seller identifiers, order totals, or ownership claims.

Never store plaintext passwords.

Do not expose private profile fields or another user's private order data.

Do not implement a security-sensitive shortcut merely to make the UI appear functional.

## 10. Business Rules Must Be Explicit

Follow the approved requirements and contracts for:

- Buyer, seller, and administrator permissions.
- Seller applications and approval.
- Catalog categories.
- Service publication and availability.
- Cart behavior.
- Checkout atomicity and idempotency.
- Order snapshots and lifecycle.
- Account deactivation.
- Moderation and audit history.

When a rule remains unresolved, do not invent a final policy.

Record the question, explain its consequences, and request a decision when it blocks implementation.

Do not treat a provisional order transition or a draft API contract as final approval.

## 11. Implementation Workflow

After the documentation audit is approved, work in small stages.

For each stage:

1. State the stage's goal and scope.
2. Identify relevant contracts.
3. Inspect affected files.
4. Implement only the approved scope.
5. Add or update tests.
6. Run relevant checks.
7. Inspect the resulting changes.
8. Report files changed and actual results.
9. Identify unresolved issues.
10. Stop before starting a consequential next stage unless it has already been authorized by the agreed plan.

Do not mix unrelated refactors with feature work.

Do not rewrite working modules unnecessarily.

Do not create placeholder features that appear complete but have no functioning backend behavior.

## 12. Testing and Reporting

Run only commands appropriate to the confirmed environment.

Distinguish clearly between:

- Passed.
- Failed.
- Blocked.
- Not run.
- Not implemented.

Report the exact commands executed and summarize their actual results.

Do not claim that a test, build, migration, or deployment succeeded unless it was executed and verified.

Do not suppress failures to obtain a green result.

If a check cannot run, explain the missing prerequisite and the next safe action.

## 13. Dependency and File Changes

Before adding or upgrading dependencies:

- Check whether the existing stack already provides the required capability.
- Explain why the dependency is needed.
- Avoid unnecessary packages.
- Preserve the existing package manager and lockfile unless a change is approved.

Do not delete or overwrite user-created files without understanding their purpose.

Do not assume example paths or filenames represent files that exist in the actual workspace.

Keep secrets and local environment files out of Git.

## 14. Git Discipline

Inspect Git status before making changes.

Do not discard unrelated user modifications.

Do not reset branches, rewrite history, force-push, or delete branches without explicit approval.

Keep changes scoped and reviewable.

Do not commit or push unless requested or explicitly approved.

## 15. UI and UX Standards

Follow `docs/ui-ux-specification.md` when it exists.

The interface should be professional, responsive, accessible, and consistent.

Use the approved blue, turquoise, and restrained gold visual direction.

Include meaningful loading, empty, success, error, and unauthorized states.

Do not fabricate ratings, reviews, transaction counts, or unsupported functionality.

Use real backend state for application behavior.

## 16. Completion Report

At the end of each stage, provide:

### Summary

What was accomplished.

### Files changed

List created, modified, or deleted files.

### Verification

Commands actually executed and their results.

### Outstanding issues

Unresolved decisions, failed checks, and limitations.

### Next step

The smallest logical next stage.

Do not repeat a previous success claim without new verification.

## 17. First Execution Instruction

When first invoked in this workspace:

**Perform only the read-only documentation and workspace audit.**

Do not start building the application yet.

Do not install packages or create migrations during the initial audit.

Do not connect to Supabase or any remote database.

Return the audit findings, list the decisions that require approval, and recommend the next implementation stage.

Wait for user approval before proceeding to implementation.
