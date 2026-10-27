# Deployment Plan — Mie Sukses Creative Marketplace

**Status:** Draft for review  
**Priority:** Free-tier deployment, reproducibility, security, and operational simplicity.

## 1. Deployment Goals

The deployment strategy must:

- Keep operating costs at zero for the initial MVP where feasible.
- Support the React and TypeScript frontend.
- Support a persistent Node.js and TypeScript backend.
- Provide a PostgreSQL database.
- Keep credentials and secrets outside source control.
- Support HTTPS.
- Make deployments reproducible from Git.
- Avoid unnecessary infrastructure complexity.
- Preserve a clear separation between local development and production.

Free-tier availability, resource limits, inactivity policies, and provider terms must be verified before selecting the final hosting configuration.

Zero cost cannot be guaranteed indefinitely.

## 2. Application Components

The application consists of three primary components.

### 2.1 Frontend

The frontend uses React, TypeScript, and Vite.

Responsibilities include:

- Rendering public and authenticated pages.
- Catalog browsing and filtering.
- Profile and dashboard interfaces.
- Cart and checkout interfaces.
- Order status and history.
- Form validation and accessible interaction states.

The frontend must not be responsible for enforcing security-sensitive business rules.

### 2.2 Backend API

The backend uses Node.js, TypeScript, and Express.

Responsibilities include:

- Authentication integration.
- Session verification.
- Authorization.
- Input validation.
- Catalog and service operations.
- Cart management.
- Checkout transactions.
- Order lifecycle enforcement.
- Media authorization.
- Administrative operations.
- Audit logging.

The backend must be deployed to an environment that supports the selected runtime and required database connections.

### 2.3 Database

The database uses PostgreSQL.

Responsibilities include:

- Persisting application data.
- Enforcing relational integrity.
- Enforcing unique and check constraints.
- Supporting transactional checkout.
- Preserving order and audit history.
- Supporting indexed queries.

The production database must be persistent. An ephemeral filesystem or temporary application storage must not be used as the primary database.

## 3. Environment Strategy

Maintain separate environments.

| Environment | Purpose | Data |
| --- | --- | --- |
| Local development | Feature development | Synthetic or local test data |
| Automated testing | Repeatable validation | Isolated test data |
| Production | Public application | Real application data |

Each environment must have independent configuration.

Production secrets must never be copied into local example files, committed to Git, or exposed through frontend environment variables.

## 4. Initial Deployment Strategy

The preferred initial architecture is:

- Static hosting for the React frontend.
- A Node.js-compatible hosting service for the Express API.
- A managed PostgreSQL service for production data.

The exact providers must be selected only after checking current free-tier terms, runtime support, connection limits, database persistence, and project requirements.

Do not select a provider solely because its landing page advertises a free plan.

The final architecture must account for the fact that a free frontend host does not automatically provide a backend runtime or PostgreSQL database.

## 5. Frontend Deployment Requirements

The frontend deployment must support:

- Building the Vite application.
- Serving static assets over HTTPS.
- Configuring the public API base URL.
- SPA route fallback where required by the router.
- Environment-specific configuration.
- Deployment from the approved Git repository.
- Reproducible builds using the committed lockfile.

The frontend must not contain:

- Database credentials.
- Backend secret keys.
- Service-role credentials.
- Private signing keys.
- Production-only administrative secrets.

Any variable exposed to a browser must be treated as public.

## 6. Backend Deployment Requirements

The backend host must support:

- The selected Node.js version.
- The Express application runtime.
- HTTPS ingress or a trusted HTTPS proxy.
- Environment-variable configuration.
- Persistent outbound database connections or an approved pooling strategy.
- Application logs.
- Health checks.
- Graceful startup and shutdown where supported.
- Appropriate request and body-size limits.

The API must listen on the port provided by the hosting environment when required by the provider.

The server must not rely on a developer's local filesystem or machine remaining online.

If the chosen host sleeps when idle, document the resulting cold-start behavior.

## 7. PostgreSQL Deployment Requirements

The production database must provide:

- Persistent storage.
- Supported PostgreSQL connectivity.
- Authentication and access controls.
- Encrypted connections where supported and required.
- Backup and recovery options appropriate to the project.
- Adequate storage and connection limits.
- A clear migration workflow.
- Monitoring or usage visibility.

Before selecting a provider, verify:

- Whether its free tier is currently available.
- Storage limits.
- Connection limits.
- Inactivity or automatic-pause policies.
- Data retention and recovery options.
- Whether a payment method is required.
- Whether the project can remain operational without a paid upgrade.

Do not assume that a free database remains available forever or that an inactive project will remain online.

## 8. Supabase as a Possible Production Option

Supabase may be evaluated as a managed PostgreSQL provider and, if deliberately selected, as a provider for authentication or object storage.

However:

- Local PostgreSQL remains the initial development database.
- Local PostgreSQL does not automatically provide Supabase Auth or Storage.
- Authentication and storage integrations must be implemented through explicit adapters.
- A Supabase project must not be selected or modified without the user's approval.
- The previous Supabase project's credentials, migrations, and configuration must not be reused by assumption.
- Remote migrations, SQL execution, policy changes, storage changes, and resource deletion require explicit approval.

If the production database uses Supabase, document the exact project and environment configuration separately from local development.

## 9. Authentication and Sessions

The production authentication strategy must be finalized before deployment.

The chosen implementation must define:

- How passwords are stored or delegated to an identity provider.
- How sessions are created and verified.
- How logout and session revocation work.
- How deactivated accounts are blocked.
- How roles are assigned and checked.
- How frontend authentication state is refreshed.
- How authentication secrets are rotated.

The frontend must never be the sole authority for deciding whether a user is an administrator or seller.

The production authentication implementation must satisfy the same business authorization rules as the local implementation.

## 10. Media Storage

Uploaded images require an explicit storage strategy.

Do not rely on a temporary backend filesystem if the hosting platform does not guarantee persistence.

The selected storage implementation must define:

- Allowed file formats.
- Maximum upload size.
- File validation.
- Object naming.
- Public versus private access.
- Ownership and access checks.
- Replacement and deletion behavior.
- Cleanup of orphaned files.
- Production storage credentials.

Possible approaches include a provider-managed object store or another persistent storage service that fits the selected deployment.

The provider and exact file limits remain open decisions until verified.

## 11. Environment Variables

Maintain an `.env.example` file containing variable names and safe placeholder values only.

Potential configuration categories include:

- Application environment.
- Frontend public API URL.
- Backend port.
- Database connection URL.
- Authentication configuration.
- Session or token secrets, if applicable.
- CORS allowed origins.
- Media storage configuration.
- Logging configuration.

The actual variable names must match the implementation.

Never commit a real `.env` file.

Never place a database URL, private key, or backend secret in a browser-exposed variable.

The application should fail clearly when required production configuration is missing rather than silently falling back to unsafe defaults.

## 12. CORS, Cookies, and HTTPS

Production configuration must explicitly define:

- Allowed frontend origins.
- Credential behavior.
- Cookie security attributes, if cookie-based sessions are selected.
- Secure transport requirements.
- CSRF protections appropriate to the authentication mechanism.
- Proxy trust configuration where needed.

Do not allow every origin with credentials enabled.

CORS is not a replacement for authentication or authorization.

HTTPS must be used for production user traffic and sensitive service connections.

## 13. Build and Deployment Pipeline

The deployment workflow should follow this sequence:

1. Pull the intended Git commit.
2. Install dependencies from the lockfile.
3. Run static analysis and type checking.
4. Run unit and integration tests.
5. Build the frontend and backend.
6. Review database migration changes.
7. Confirm the target environment.
8. Apply only the approved production migration, if required.
9. Deploy the application.
10. Run health checks and smoke tests.
11. Verify essential user journeys.
12. Record the deployed commit and actual results.

The pipeline must not silently execute destructive database operations.

Automatic deployment may be enabled only after the repository, deployment target, and migration behavior are understood.

## 14. Health Checks and Logging

The backend should expose an appropriate health endpoint.

Health checks must not reveal secrets or internal infrastructure details.

Operational logging should help diagnose:

- Application startup failures.
- Database connectivity failures.
- Request failures.
- Unexpected exceptions.
- Authentication integration failures.
- Storage failures.

Logs must not contain passwords, session tokens, secret keys, or unnecessary personal information.

Database health and application health should be distinguishable.

## 15. Backup and Recovery

Before accepting important production data, establish a recovery strategy appropriate to the selected provider.

Document:

- Available automated backups.
- Backup retention.
- Manual export procedures where appropriate.
- Recovery steps.
- Migration recovery.
- Expected data-loss limitations.

A database export is not proven usable merely because the export command succeeded. Recovery should be tested when practical.

Free-tier limitations must be clearly stated.

## 16. Deployment Verification

After deployment, verify:

- The frontend loads over HTTPS.
- Public routes and SPA navigation work.
- The frontend communicates with the intended API.
- The backend health endpoint responds.
- Database connectivity works.
- Authentication works in the deployed environment.
- Unauthorized access is rejected.
- Catalog data loads correctly.
- Cart and checkout operations behave correctly.
- Orders and status history persist.
- Media uploads and access controls work.
- No secrets are exposed to the browser.
- Logs contain no sensitive credentials.
- Critical workflows remain functional after a restart or redeployment.

A successful hosting build does not prove that the complete application works.

## 17. Rollback and Incident Response

For each production deployment, record:

- The deployed commit.
- The migration version.
- Configuration changes.
- Known limitations.
- Verification results.

If a deployment fails:

1. Identify the failing component.
2. Preserve relevant logs.
3. Prevent repeated destructive operations.
4. Roll back application code when safe.
5. Handle database changes according to the migration recovery plan.
6. Verify the restored application.
7. Document the cause and recovery.

Do not automatically reverse a database migration if doing so could destroy valid user data.

## 18. Cost and Free-Tier Policy

The initial target is zero monthly hosting cost.

Before choosing providers, compare their current offerings against:

- Static frontend hosting.
- Persistent Node.js backend hosting.
- Managed PostgreSQL.
- Media storage.
- Build and deployment limits.
- Bandwidth and request limits.
- Sleep or inactivity policies.
- Backup and recovery capabilities.

If no combination satisfies the requirements reliably at zero cost, document the trade-offs before choosing a fallback.

Do not enable paid resources or incur charges without explicit approval.

## 19. Deployment Completion Criteria

Deployment is considered complete only when:

- The production architecture is documented.
- All required providers have been selected and verified.
- Environment variables are configured securely.
- Database migrations are reviewed and applied through the approved process.
- Build and test results are recorded.
- Health checks pass.
- Essential user journeys are verified.
- Security controls are enabled.
- Backup and recovery limitations are documented.
- Actual costs and free-tier restrictions are disclosed.

## 20. Open Decisions

The following must be finalized before deployment:

- Frontend hosting provider.
- Backend hosting provider.
- Managed PostgreSQL provider.
- Production authentication implementation.
- Persistent media storage provider.
- Session and cookie strategy.
- Migration execution process.
- Backup and recovery approach.
- Provider-specific resource limits and costs.

These choices must be verified against current provider documentation before implementation.

## 21. Safety Boundary

Writing deployment documentation does not authorize creating or modifying cloud resources.

Do not deploy, purchase services, enable paid resources, modify a remote database, change storage policies, or delete remote resources without explicit user approval.

## Local media storage limitation

Development uploads are stored on the API server's local disk under the configured upload directory. This is suitable only for local development: files are not shared across multiple API instances and can be lost when an ephemeral host is replaced. Before deployment, select persistent private object storage, migrate existing objects without changing their authorized keys, preserve order/application access checks, and validate backup, retention, and cleanup behavior. Simulated checkout, wallet top-ups, refunds, and withdrawals do not move real money and must not be represented as settled external payments.
