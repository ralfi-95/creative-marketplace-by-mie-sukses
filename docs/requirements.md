# Product Requirements — Mie Sukses Creative Marketplace

**Status:** Draft for review  
**Product type:** Student creative-services marketplace  
**Primary language:** Indonesian  
**Currency:** Indonesian Rupiah (IDR)  
**Initial release:** MVP

## 1. Product Overview

Mie Sukses Creative Marketplace is a web platform where customers can discover and order creative services offered by sellers.

The marketplace may include services such as:

- Video and photo editing.
- Photography.
- Graphic design.
- UI/UX design.
- Other approved creative services.

The platform supports service discovery, seller profiles, cart management, checkout, order tracking, seller applications, and administrative moderation.

The product is a service marketplace, not a physical-goods store.

The initial release uses simulated payment behavior. It does not require a real payment gateway.

## 2. Product Goals

The MVP must:

1. Allow visitors to browse available creative services.
2. Allow users to register, log in, and manage their profiles.
3. Allow users to apply to become sellers.
4. Allow approved sellers to publish and manage services.
5. Allow buyers to search, filter, and inspect service details.
6. Allow buyers to manage a persistent active cart.
7. Allow buyers to check out and receive trackable orders.
8. Allow sellers to manage orders assigned to them.
9. Allow administrators to review applications and moderate the marketplace.
10. Preserve important order history and audit records.
11. Run locally before any cloud integration.
12. Be testable and deployable with a low-cost architecture.

## 3. User Roles

### 3.1 Visitor

A visitor is not authenticated.

Visitors may:

- View the home page.
- Browse published services.
- Search and filter the catalog.
- View service details.
- View public seller profiles.
- Register or log in.

Visitors may not:

- Add items to a persistent user cart.
- Check out.
- View private account data.
- Access seller or admin tools.

### 3.2 Buyer

A buyer is an authenticated user with an active account.

Buyers may:

- Update permitted profile fields.
- View their own order history.
- Add or remove services in their active cart.
- Check out their cart.
- View order details and order events.
- Complete an order when the documented transition rules allow it.
- Submit a seller application.
- Submit an admin-access request if eligible.

Buyers may not:

- Purchase their own services.
- Modify trusted prices or order totals.
- Change order status by editing client-side data.
- View another user's private cart, profile, or order history.
- Grant themselves elevated roles.

### 3.3 Seller

A seller is a user approved to provide marketplace services.

A seller may:

- Manage their permitted profile fields.
- Create service drafts.
- Edit their own services.
- Upload permitted service media and portfolio images.
- Publish a service when all publication requirements are satisfied.
- Archive their own services.
- View orders assigned to them.
- Accept or reject eligible pending orders.
- Move accepted orders into `in_progress`.

A seller may not:

- Edit another seller's services.
- Change their own role or approval status.
- Change historical order snapshots.
- Set order prices after an order has been created.
- View unrelated sellers' private orders.

Seller permissions do not override account suspension or deactivation.

### 3.4 Administrator

An administrator may:

- Review seller applications.
- Review admin-access requests.
- Promote eligible users through authorized operations.
- Suspend, restore, or archive services under documented moderation rules.
- Perform permitted account-management actions.
- Review relevant audit records.

Administrative actions must be authorized by the backend and recorded where required.

The system must prevent an operation from removing or demoting the last active administrator.

An administrator must not promote themselves through the ordinary role-promotion workflow.

## 4. Authentication and Profiles

The application must provide:

- Registration.
- Login.
- Logout.
- Current-session retrieval.
- Profile viewing and updating.
- Profile avatar management.
- Account deactivation through an authorized operation.

Registration must create the application profile and authentication identity consistently.

Passwords must be handled by the selected authentication implementation and must never be stored as plaintext in the profile table.

The profile may include a display name and avatar reference.

Public seller profiles may expose only approved public fields. Email addresses and other private account information must not be exposed through public profile endpoints.

Account deactivation must prevent further protected actions, apply the documented session-revocation behavior, and preserve required order history and audit records.

Exact behavior for deactivation while orders are active must be finalized before implementation.

## 5. Seller Applications

Users may submit an application to become sellers.

A seller application must include:

- A reason for applying, between 30 and 2,000 characters.
- A portfolio URL using HTTP or HTTPS.
- The application's submission timestamp.
- A review status.

Application statuses:

- `pending`
- `approved`
- `rejected`

Rules:

1. A user may have at most one pending seller application at a time.
2. Only authorized administrators may review applications.
3. A reviewed application cannot be reviewed again as if it were pending.
4. Approval and seller-role assignment must succeed atomically.
5. Rejection must preserve the decision and any required review information.
6. Application status must not be controlled by the applicant.
7. A user must not receive seller permissions merely by submitting an application.

The policy for applying again after rejection must be defined before implementation.

## 6. Admin-Access Requests

The application may support a formal request for administrator access.

Requests must be reviewed by an authorized existing administrator.

Approval must use a trusted role-management operation and create a role-audit record.

The system must prevent self-promotion and protect the last active administrator.

The exact eligibility rules for submitting an admin-access request—including whether seller status is required—remain an open decision and must be resolved before implementation.

An admin-access request does not grant any additional permissions while pending.

## 7. Service Catalog

Visitors and authenticated users may browse published services.

The catalog must support:

- Service listing.
- Service detail pages.
- Keyword search.
- Category filtering.
- Seller attribution.
- Displayed price in IDR.
- Thumbnail display.
- Relevant loading, empty, and error states.

The initial categories are:

| Slug | Display name |
| --- | --- |
| `video-foto-editing` | Video & Foto Editing |
| `fotografi` | Fotografi |
| `desain-grafis` | Desain Grafis |
| `ui-ux-design` | UI/UX Design |

Service requirements:

- Title: 5–100 characters.
- Description: non-empty and at most 10,000 characters.
- Price: a positive integer amount in IDR.
- Category: an existing approved category.
- Thumbnail: required before publication.
- Seller: an active, approved seller.

Service statuses:

- `draft`
- `published`
- `suspended`
- `archived`

Only published services from eligible active sellers may be ordered.

Sellers may edit only their own services. A service's owner must not be changeable through ordinary editing.

Suspended and archived services must not be purchasable.

## 8. Portfolio and Media

Sellers may upload portfolio images for their own services.

The maximum number of portfolio images is eight per service.

Uploads must follow the security and storage rules in `docs/security.md`.

The application must validate file type, file content, size, ownership, and permitted destination.

Private media associated with drafts, suspended services, or archived services must not become publicly accessible merely because the service detail page is known.

Media cleanup must be retry-safe.

Exact file-size limits, accepted formats, and image dimensions must be specified before implementation.

## 9. Cart

Each buyer has one persistent active cart.

A cart may contain services from multiple sellers.

Rules:

1. Only authenticated, active users may manage their own cart.
2. A service may appear at most once in a cart.
3. Quantity is always one; quantity editing is not supported.
4. A buyer may remove a cart item.
5. Cart contents must be validated again during checkout.
6. The cart must not be treated as a trusted source of price.
7. Adding an unavailable service must fail with a clear error.
8. The active cart contains only the current cart state, not a separate order history.
9. Successful checkout clears the purchased items atomically.
10. Order history remains available after the active cart is cleared.

A buyer may purchase the same service again in a later checkout, subject to the service remaining orderable.

## 10. Checkout and Simulated Payment

The MVP does not require a real payment gateway.

Checkout creates marketplace orders and records the initial order state. Any payment-related UI must clearly identify the payment flow as simulated and must not claim that real funds have been transferred.

Rules:

1. Any authenticated, active account may check out; the account becomes the buyer party on those orders regardless of its global role.
2. Empty carts cannot be checked out.
3. The backend derives buyer identity from the authenticated session.
4. The backend obtains service prices and seller identities from trusted database records.
5. The backend validates the availability of every cart item.
6. The buyer cannot purchase their own service.
7. One checkout may contain services from multiple sellers.
8. Checkout creates one order per cart item.
9. Each order starts with status `pending`.
10. Each order records an immutable snapshot of relevant service and price information.
11. Each order has quantity one.
12. Checkout, order creation, initial order events, and cart clearing must be atomic.
13. A failed checkout must not leave partial orders or clear the cart.
14. Retrying a checkout must not create duplicate orders.
15. Idempotency behavior must follow the final API and database contracts.

The final idempotency request shape and retry behavior must be reconciled across `api-contract.md` and `database-contract.md` before implementation.

## 11. Order Management

Order statuses:

- `pending`
- `paid`
- `accepted`
- `in_progress`
- `work_submitted`
- `under_dispute`
- `completed`
- `resolved`
- `rejected`
- `refunded`
- `cancelled`

`cancelled` remains readable for historical orders. It is not available as a normal user transition.

Initial transition proposal:

| Current status | Allowed next status | Authorized actor |
| --- | --- | --- |
| `paid` | `accepted` | Assigned seller |
| `paid` | `under_dispute` | Assigned seller, rejection path |
| `accepted` | `in_progress` | Assigned seller |
| `work_submitted` | `completed` | Order buyer |
| `work_submitted` | `under_dispute` | Order buyer or seller with the matching complaint |

The initial status of every order is `pending`.

Every successful status transition must create an order event atomically with the status change.

Users must not be allowed to skip required transitions or modify order history directly.

Buyers may view their own orders. Sellers may view orders assigned to them. Administrators may access order information only through authorized administrative workflows.

### Open order-policy decisions

The exact behavior for account deactivation when active orders exist remains open.

Do not invent these rules during implementation. Ask for approval or use an explicitly documented provisional decision.

## 12. Order History and Auditability

The application must preserve order history independently of the active cart.

Orders must retain the service title, seller identity, price, and other required snapshots from checkout.

Order events must preserve the sequence of status transitions.

Role changes and administrative moderation actions must be auditable.

Historical order and audit records must not be silently rewritten to reflect later changes to service descriptions, prices, seller names, or roles.

## 13. Admin Dashboard

The admin dashboard must provide authorized access to:

- Seller application review.
- Admin-access request review.
- Service moderation.
- Relevant account-management operations.
- Moderation history.
- Role-change audit history.

Administrative operations must validate the administrator's current permission on the backend.

A UI control being visible or hidden is not an authorization mechanism.

Administrative changes must return a clear result and must be recorded as required by the database and security contracts.

## 14. UI and UX Requirements

The interface must be responsive and usable on desktop and mobile.

The visual direction is a professional creative marketplace with:

- Beach-blue and fresh blue-green/turquoise tones.
- Subtle gradients.
- Restrained soft-gold accents.
- Clear visual hierarchy.
- Readable typography.
- Consistent spacing and reusable components.
- Clear loading, empty, success, validation, and error states.

Avoid a generic template appearance. Reference existing marketplaces for interaction patterns, not for copying their design or assets.

All essential functionality must remain usable without relying exclusively on color.

Forms must display useful validation messages. Destructive actions must be clearly identified and require appropriate confirmation.

Detailed component behavior and layout rules belong in `docs/ui-ux-specification.md`.

## 15. Non-Functional Requirements

### Security

- Enforce authorization on the backend.
- Apply least privilege to database and storage access.
- Validate inputs.
- Protect secrets.
- Prevent cross-user data access.
- Follow `docs/security.md`.

### Maintainability

- Keep business rules in testable modules.
- Avoid duplicated authorization and validation logic.
- Use explicit contracts between frontend and backend.
- Keep database schema changes version-controlled.
- Avoid unnecessary dependencies and infrastructure.

### Reliability

- Use transactions for critical multi-step operations.
- Make checkout retries safe.
- Preserve order and audit history.
- Provide clear errors for recoverable failures.

### Performance

- Use pagination for growing lists.
- Add indexes for common lookup patterns.
- Avoid fetching unnecessary private or large media data.
- Keep frontend bundles and dependencies reasonable for the MVP.

### Accessibility

- Use semantic HTML.
- Support keyboard navigation for essential interactions.
- Provide accessible labels for form controls.
- Maintain readable contrast.
- Communicate errors in text rather than color alone.

## 16. MVP Scope

### Included

- Authentication and profiles.
- Public service catalog.
- Search and category filters.
- Seller applications.
- Seller service management.
- Avatar, thumbnail, and portfolio media workflows.
- Active cart.
- Checkout with simulated payment behavior.
- Order history and status tracking.
- Admin application review and moderation.
- Role and moderation audit records.
- Automated tests for critical workflows.

### Excluded from the initial release

- Real payment gateway integration.
- Automatic payment settlement.
- WhatsApp Cloud API integration.
- Real-time chat between buyers and sellers.
- Recommendation algorithms.
- Microservices.
- Paid third-party services required for core functionality.

Additional features require explicit scope review.

## 17. Acceptance Criteria

The MVP is not complete until the following have been verified:

1. A visitor can browse published services.
2. A user can register, log in, log out, and manage permitted profile fields.
3. A buyer can submit a seller application.
4. An authorized administrator can review an application.
5. An approved seller can create and publish a valid service.
6. A buyer can search and filter services.
7. A buyer can add and remove services from their cart.
8. A buyer can check out multiple cart items, including items from different sellers.
9. Checkout creates exactly one order per cart item.
10. Checkout uses trusted prices and stores immutable order snapshots.
11. Failed checkout does not leave partial orders or clear the cart.
12. Checkout retries do not duplicate orders.
13. Buyers and sellers can view only the orders they are authorized to access.
14. Valid order transitions create corresponding order events.
15. Unauthorized role changes and cross-user access attempts are rejected.
16. Private media is not exposed to unauthorized users.
17. Administrative actions preserve required audit records.
18. The application can be set up locally from repository documentation.
19. The automated test suite and production build complete successfully.
20. Deployment steps are documented, and any remote changes require explicit approval.

Acceptance criteria must be supported by actual test results before being marked complete.

## 18. Decisions Required Before Implementation

The following decisions must be resolved during documentation review:

1. The local authentication implementation and session strategy.
2. The exact backend framework and database-access library.
3. The local and production media-storage adapters.
4. Whether buyers may complete orders by marking them `completed`.
5. Account deactivation when active orders exist.
6. Seller reapplication after rejection.
7. Eligibility to request admin access.
8. Checkout idempotency request and retry semantics.
9. Media size, format, and dimension limits.
10. Final free-tier deployment providers and their current limitations.

No implementation should silently resolve these decisions by inventing business behavior.

## 19. Change Control

Changes to product behavior must be reflected in this document and all affected contracts before implementation.

If requirements conflict with the database, API, or security contracts, stop and report the conflict.

Do not modify remote infrastructure, execute remote SQL, apply remote migrations, or change Supabase resources without explicit user approval.

The documentation describes intended behavior; it does not prove that any feature has already been implemented.
