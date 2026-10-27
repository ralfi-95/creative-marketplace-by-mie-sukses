# Migration Plan — Mie Sukses Creative Marketplace

**Status:** Draft for review  
**Strategy:** Local-first, version-controlled, explicit migration control.

## 1. Purpose

This document defines how database schema changes are created, reviewed, tested, and eventually deployed.

The objectives are to:

- Keep the database schema consistent with the application contracts.
- Make schema changes reproducible on another developer's machine.
- Avoid undocumented manual database edits.
- Detect migration errors before they affect important data.
- Keep local development independent of remote Supabase.
- Make future production migration an explicit, reviewable operation.

## 2. Source of Truth

The version-controlled migration files are the source of truth for database schema changes.

The intended flow is:

1. Define the requirement and database contract.
2. Create a migration file.
3. Apply it to a disposable local test database.
4. Run schema and application tests.
5. Apply it to the local development database.
6. Review and commit the migration with the associated application changes.
7. Prepare a separate production migration plan when deployment is approved.

A database dashboard must not become an undocumented alternative source of truth.

The live database is not automatically authoritative merely because it contains the latest changes.

## 3. Environment Separation

Maintain separate configurations for:

- **Local development:** the developer's local PostgreSQL database.
- **Automated testing:** a disposable test database.
- **Production:** the approved hosted database, when configured.

Each environment must have separate credentials and configuration.

Production credentials must never be copied into development fixtures or committed to Git.

Tests must not run against production by default.

## 4. Migration File Organization

Store database migrations in:

`database/migrations/`

Use sequential, descriptive filenames, for example:

- `001_create_profiles.sql`
- `002_create_seller_applications.sql`
- `003_create_catalog_tables.sql`
- `004_create_cart_tables.sql`
- `005_create_checkout_and_orders.sql`
- `006_create_audit_tables.sql`
- `007_add_indexes_and_constraints.sql`

These names illustrate the intended organization; the final migration sequence must follow the audited database contract.

Each migration must:

- Have a unique, stable identifier.
- Perform one coherent schema change.
- Be reviewable independently.
- Avoid unrelated modifications.
- Include required constraints and indexes.
- Be tested against a disposable database.
- Document any operational risk.
- Avoid hard-coded production-specific values.

Do not create these files by copying the current state of an unknown remote database.

## 5. Migration History

The migration runner must maintain a migration-history table containing at least:

- Migration identifier.
- Migration name.
- Application timestamp.
- Execution status or equivalent reliable success record.
- Checksum, if supported by the selected migration tool.

The runner must not mark a migration successful before its changes have succeeded.

It must detect previously applied migrations and avoid applying them twice.

If an applied migration's contents have changed, the tool should report a checksum mismatch instead of silently treating it as unchanged.

The final implementation must select and document one migration mechanism rather than combining several competing systems.

## 6. Initial Schema Creation

Before creating the first schema migration, audit these requirements:

- User profiles and account status.
- Seller applications and review history.
- Administrator access requests and role changes.
- Categories and services.
- Service portfolio media metadata.
- Cart and cart-item constraints.
- Checkout idempotency.
- Checkout batches.
- Orders and immutable purchase snapshots.
- Order transition history.
- Moderation and role audit events.
- Foreign keys, unique constraints, check constraints, and indexes.

The migration sequence must preserve valid dependency order.

For example, a table referencing profiles must not be created before its referenced table exists.

Authentication-provider-specific tables must not be assumed until the local authentication design is finalized.

## 7. Local Migration Workflow

For every schema change:

1. Review the relevant requirements and contracts.
2. Write the migration.
3. Create or reset a disposable test database.
4. Apply all migrations from an empty schema.
5. Verify the resulting schema.
6. Run database tests.
7. Run relevant backend integration tests.
8. Test failure and rollback behavior where applicable.
9. Apply the migration to the local development database only after validation.
10. Commit the migration and related application changes together.

A developer must be able to reproduce the schema using the committed migration history.

## 8. Transaction and Rollback Policy

Use database transactions for migrations when PostgreSQL and the operations involved support transactional execution.

Some database operations may not be transactional or may have operational restrictions. Such operations require an explicit plan and must not be treated as ordinary rollback-safe migrations.

A rollback plan must specify:

- Whether the migration is reversible.
- Which data could be lost.
- Whether a forward-fix is safer.
- Whether a backup is required.
- What verification must occur after recovery.

Do not assume that every migration can be safely reversed.

For production changes, a forward-fix may be preferable to a destructive rollback.

## 9. Data Migrations

Schema changes and data transformations must be reviewed separately when they have different risks.

A data migration must specify:

- The records it affects.
- How the transformed data is validated.
- Whether the operation is idempotent.
- How partial failure is detected.
- Whether the operation can be retried safely.
- Whether a backup or recovery procedure is required.

Never delete order history, audit history, or other retained records merely to simplify a migration.

Destructive transformations require explicit review.

## 10. Development and Test Database Safety

Before executing a migration, verify the database target.

The migration workflow must:

- Display or otherwise verify the selected environment.
- Reject production targets during ordinary local test commands.
- Use dedicated test credentials.
- Avoid silently switching database URLs.
- Avoid running migrations automatically against remote resources.
- Fail clearly when the database target is ambiguous.

A command named `test`, `dev`, or `reset-local` must not unexpectedly mutate a remote database.

## 11. PostgreSQL and Supabase Compatibility

The application begins with local PostgreSQL.

If Supabase is approved for production later, compatibility must be reviewed explicitly.

The review must cover:

- PostgreSQL version compatibility.
- Extensions and database privileges.
- Authentication identity mapping.
- Row-level security policies, if applicable.
- Storage metadata and object access.
- Migration permissions.
- Transaction behavior.
- Production backup and recovery.
- Connection pooling and connection limits.

Local PostgreSQL does not automatically provide Supabase Auth, Storage, or Supabase-specific APIs.

Do not introduce Supabase-specific SQL or assumptions into the local schema without documenting why they are needed.

## 12. Remote Migration Approval Gate

Remote migration is a separate operational action, not part of ordinary development.

Before any remote migration:

1. Confirm the exact target project and database.
2. Confirm that the target is the intended environment.
3. Review the full migration diff.
4. Check compatibility with the deployed application.
5. Back up important data when appropriate.
6. Define a recovery or forward-fix procedure.
7. Run local validation.
8. Obtain explicit user approval for the remote operation.
9. Execute only the approved change.
10. Verify the result and report the actual outcome.

Approval to write documentation or local migration files does not authorize remote SQL execution, remote migration, or resource deletion.

Never reuse the previous Supabase project's credentials, configuration, or migration history by assumption.

## 13. Migration Testing Requirements

Each migration must be tested for:

- Successful application to an empty database.
- Successful application after earlier migrations.
- Correct table and column definitions.
- Expected constraints and indexes.
- Valid foreign-key relationships.
- Compatibility with seed data.
- Compatibility with relevant application queries.
- Safe failure behavior.
- Detection of duplicate migration execution.
- Correct migration-history records.

The migration test suite must not depend on production data.

## 14. Seed Data Policy

Keep development and test seed data separate from production data.

Development seeds may include:

- The four approved catalog categories.
- Clearly labeled sample services.
- Synthetic buyer and seller records.
- Test orders for supported order states.

Seeds must be repeatable where practical.

Do not hard-code real passwords or personal information into seed files.

If an administrator account is required, use a documented local-only setup process rather than a universal default password.

## 15. Definition of Done

A migration is ready when:

- Its purpose is documented.
- It matches the approved database contract.
- It applies successfully to a disposable database.
- Constraints and indexes are verified.
- Relevant tests pass.
- Its safety and rollback characteristics are understood.
- Its history entry is correct.
- The intended environment is explicit.
- No unauthorized remote operation occurred.

## 16. Open Decisions

The following must be finalized before implementation:

- Migration tool and exact commands.
- Database driver and query strategy.
- Authentication identity schema.
- Exact order-transition policy.
- Checkout idempotency contract.
- Media metadata and storage integration.
- Required PostgreSQL extensions and privileges.
- Production hosting and migration execution strategy.

Do not resolve these questions by silently inventing behavior.

## 17. Non-Negotiable Rule

**Local development is the default. Remote database changes require explicit approval.**

Every developer must be able to identify which database a command targets before executing it.

The project must never depend on undocumented dashboard edits or an assumed synchronization between local and remote databases.
