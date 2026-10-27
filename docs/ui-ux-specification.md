# UI/UX Specification — Mie Sukses Creative Marketplace

**Status:** Draft for review  
**Product:** Mie Sukses Creative Marketplace  
**Platform:** Responsive web application  
**Primary language:** Indonesian  
**Design direction:** Professional creative marketplace with fresh coastal colors and restrained premium accents.

## 1. Design Goals

The interface must:

1. Feel professional, modern, and trustworthy.
2. Give creative services and their visual work the strongest visual emphasis.
3. Make browsing, comparing, and ordering services straightforward.
4. Provide consistent patterns across buyer, seller, and admin areas.
5. Remain responsive on desktop, tablet, and mobile.
6. Provide meaningful loading, empty, validation, success, and error states.
7. Avoid generic template styling and unnecessary decoration.
8. Use reusable components rather than duplicating page-specific UI.
9. Remain accessible and usable with keyboard navigation.
10. Match the behavior defined in `docs/requirements.md` and `docs/api-contract.md`.

The interface must not imply that a feature works when its backend operation is not implemented.

## 2. Visual Identity

### Color direction

Use a coastal palette built around beach blue, turquoise, blue-green, and restrained soft-gold accents.

Suggested initial tokens:

| Token | Suggested value | Intended use |
| --- | --- | --- |
| `color-primary` | `#167D9A` | Primary actions and links |
| `color-primary-hover` | `#11667D` | Hover and active primary states |
| `color-secondary` | `#35B8AC` | Secondary accents |
| `color-accent` | `#E7C879` | Restrained highlights |
| `color-background` | `#F5FAFC` | Main page background |
| `color-surface` | `#FFFFFF` | Cards and panels |
| `color-text` | `#18313B` | Primary text |
| `color-text-muted` | `#637780` | Secondary text |
| `color-border` | `#DCE8EC` | Borders and separators |
| `color-danger` | `#B93838` | Destructive actions and errors |
| `color-success` | `#217A57` | Success states |

These are starting values, not immutable brand requirements. Verify text contrast and refine the palette before implementation is considered complete.

### Color rules

- Use primary colors consistently for the main action hierarchy.
- Use turquoise for selected accents and supporting UI.
- Use soft gold sparingly for small highlights, badges, or decorative details.
- Do not use gold for long text or low-contrast controls.
- Do not communicate status through color alone.
- Use neutral surfaces to let service thumbnails and portfolio work stand out.
- Avoid excessive gradients, glowing effects, and saturated backgrounds.
- Define colors as CSS custom properties rather than scattering hex values across components.

### Typography

Use a clean sans-serif typeface with good Indonesian character support.

Typography must establish a clear hierarchy between:

- Page titles.
- Section headings.
- Service titles.
- Prices.
- Body text.
- Labels and helper text.
- Metadata and timestamps.

Use consistent font sizes, line heights, and weights. Avoid excessive uppercase text and very small secondary text.

The design must remain readable at browser zoom levels of at least 200%.

## 3. Layout and Spacing

Use a consistent spacing scale and shared layout primitives.

Suggested spacing scale:

- `4px`
- `8px`
- `12px`
- `16px`
- `24px`
- `32px`
- `48px`
- `64px`

Rules:

- Use a centered content container with a reasonable maximum width.
- Keep page gutters consistent.
- Align headings, forms, cards, and action groups to a predictable grid.
- Give interactive elements adequate spacing.
- Avoid layouts that rely on fixed desktop widths.
- Prevent horizontal overflow at mobile widths.
- Use whitespace to separate content groups rather than adding unnecessary borders everywhere.

Create shared tokens for container widths, spacing, border radii, shadows, and responsive breakpoints.

## 4. Navigation

### Public navigation

The public navigation should provide access to:

- Marketplace home.
- Service catalog or categories.
- Search.
- Login and registration when unauthenticated.
- Cart, profile, and relevant account navigation when authenticated.

The active navigation state must be visually distinguishable.

### Authenticated navigation

Navigation options depend on the user's current permissions.

Buyer-facing navigation may include:

- Browse services.
- Cart.
- My orders.
- Profile.

Seller-facing navigation may additionally include:

- My services.
- Create service.
- Incoming orders.

Admin-facing navigation may additionally include:

- Dashboard.
- Application review.
- Service moderation.
- Audit history where authorized.

Navigation visibility improves usability but does not replace backend authorization.

### Responsive navigation

On narrow screens, use a compact navigation pattern with accessible controls.

The mobile navigation must:

- Be keyboard operable.
- Clearly indicate the expanded or collapsed state.
- Close when appropriate after navigation.
- Avoid covering essential page actions.
- Keep account and cart access discoverable.

## 5. Public Home Page

The home page should communicate what the marketplace offers and make service discovery the primary action.

Suggested sections:

1. Main hero with a clear headline and search entry point.
2. Primary action to explore services.
3. Category navigation.
4. Featured or recently published services, if supported by real backend data.
5. Short explanation of how ordering works.
6. Seller participation call to action.
7. Footer with relevant navigation and information.

The hero must not occupy so much space that visitors cannot discover services quickly.

Use real application data for service cards. Placeholder content must be clearly identified during development and must not masquerade as production data.

Do not create fake ratings, reviews, completed-order counts, or testimonials.

## 6. Catalog and Search

The catalog must support:

- Search by keyword.
- Category filtering.
- Clear indication of active filters.
- Empty-result messaging.
- Loading and error states.
- Service-card navigation to the detail page.

Search behavior must match the backend API contract.

Search inputs must be accessible and have a clear label or accessible name.

Filtering should preserve a sensible browsing context when users navigate back from a service detail page.

If sorting or pagination is not implemented by the backend, the interface must not imply that it is available.

## 7. Service Cards

Each service card should show, where applicable:

- Service thumbnail.
- Service title.
- Category.
- Seller display name.
- Price in IDR.
- A clear action to view the service.

Rules:

- Use a consistent image aspect ratio.
- Preserve image proportions and use appropriate cropping.
- Provide an accessible alternative for meaningful images.
- Use Indonesian Rupiah formatting consistently.
- Avoid showing private seller data.
- Do not invent ratings or popularity metrics.
- Keep the clickable area predictable and keyboard accessible.
- Make hover effects subtle and ensure they do not replace focus indicators.

The card must not expose a purchase action for services that the backend identifies as unavailable.

## 8. Service Detail Page

The detail page should prioritize understanding the service before ordering it.

Recommended information hierarchy:

1. Service title.
2. Main thumbnail.
3. Seller attribution.
4. Price.
5. Full description.
6. Category.
7. Published portfolio images, if available.
8. Add-to-cart action.
9. Clear feedback after a cart operation.

The page must clearly indicate when a service is unavailable, suspended, archived, or otherwise not orderable.

Only display status information that the current user is authorized to see.

Do not imply that service pricing includes a feature, delivery time, revision count, or guarantee unless the backend data and product requirements support it.

## 9. Authentication Pages

Registration and login pages must be simple, readable, and consistent.

Requirements:

- Clearly labeled inputs.
- Appropriate input types.
- Useful validation messages.
- Loading states during submission.
- Prevention of accidental duplicate submissions.
- Clear authentication failure messages.
- Password visibility toggle if implemented accessibly.
- Links between login and registration.
- Keyboard-operable forms.
- No secret or password values in client logs.

Never display raw stack traces or internal authentication-provider errors to users.

After successful authentication, navigation must respect the user's permissions and the application's routing rules.

## 10. Profile Page

The profile page must distinguish editable private information from public seller information.

Possible sections:

- Avatar.
- Display name.
- Email display where appropriate.
- Account information.
- Profile update form.
- Account deactivation action, if enabled.

Rules:

- Show only fields permitted by the API contract.
- Validate forms before submission and handle backend validation errors.
- Indicate unsaved changes when practical.
- Ask for confirmation before destructive account actions.
- Explain the consequences of deactivation before the final confirmation.
- Never claim permanent deletion if the backend performs deactivation.

Seller profile views must expose only approved public information.

## 11. Seller Application

The application form must explain what is required to become a seller.

Fields:

- Reason for applying.
- Portfolio URL.

The interface must communicate the documented character limits and URL requirements.

The page should display the user's current application status when available:

- Pending.
- Approved.
- Rejected.

Prevent accidental duplicate submissions while a request is processing.

If a pending application already exists, explain the state rather than repeatedly submitting the same request.

Do not promise approval or a review time unless an explicit policy supports that promise.

## 12. Seller Dashboard

The seller dashboard should prioritize operational tasks.

Possible sections:

- Summary of the seller's services.
- Service status overview.
- Incoming orders.
- Recent order activity.
- Actions to create or edit services.

Only show statistics that can be derived from actual authorized data.

Avoid decorative metrics that have no implemented source.

The dashboard must make the difference between draft, published, suspended, and archived services clear.

Seller actions must be limited to the seller's own resources.

## 13. Service Editor

The service editor must support:

- Title.
- Description.
- Category.
- Price in IDR.
- Thumbnail upload.
- Portfolio image management where supported.
- Draft saving.
- Publishing when requirements are satisfied.
- Archiving where permitted.

Requirements:

- Display field constraints.
- Show image previews when useful.
- Provide upload progress or processing feedback when supported.
- Display clear validation errors.
- Prevent accidental loss of unsaved edits where practical.
- Ask for confirmation before destructive actions.
- Do not expose internal storage paths as public URLs.
- Do not let client-side form values override server authorization.

Publishing must be blocked until the backend confirms that the service satisfies the publication rules.

## 14. Cart

The cart must show:

- Service thumbnail.
- Service title.
- Seller name.
- Current displayed price.
- Remove action.
- Checkout action.
- Cart total calculated from displayed item prices.

Rules:

- Quantity controls must not be shown because quantity is always one.
- Duplicate service entries must not be created.
- Unavailable items must be clearly identified.
- The backend must recalculate the authoritative total during checkout.
- The frontend total is informational and must not be treated as the final trusted amount.
- If an item becomes unavailable, explain why checkout cannot proceed.
- A successful checkout must update the cart view to reflect the cleared cart.

An empty cart should have a useful message and a direct route back to browsing services.

## 15. Checkout

The checkout page must show an understandable summary of the items being ordered.

Requirements:

- List all selected services.
- Display seller attribution.
- Display the current price returned by the backend.
- Show the total as informational until checkout is validated.
- Explain that payment is simulated in the MVP.
- Prevent repeated submission while a request is in progress.
- Display a useful result after success or failure.
- Preserve recoverable cart state after failed checkout.

The checkout page must not ask for real card details or claim that real payment was processed.

Before confirmation, show the service, seller, amount, zero existing fees, total, and selected method. Me-Wallet review shows available and resulting balance; other methods identify their destination as simulated. Bank references are demo-only, e-wallet uses only the fixed demo PIN `123456`, and QRIS patterns must state that they cannot be scanned. Back or cancel leaves the order unpaid. Show success only after the API confirms settlement, with its reference and next step.

Checkout success must be based on the backend response, not on the user clicking the button.

If retry handling is exposed in the UI, it must follow the documented idempotency contract.

## 16. Order History and Details

The buyer's order history must show only the buyer's own orders.

Each order summary should display:

- Order identifier.
- Service title snapshot.
- Seller attribution snapshot.
- Price snapshot.
- Current status.
- Creation timestamp.

The detail page may additionally show:

- Relevant order events.
- Current status explanation.
- Available next action.
- Relevant seller or buyer information permitted by the API.

Status labels must be human-readable in Indonesian while preserving the canonical status values in the application code.

The interface must not show an action that the current actor is not permitted to perform.

Do not fabricate order progress or timestamps.

## 17. Order Status Presentation

Use a consistent status label and visual treatment for each canonical order status.

| Status | Suggested Indonesian label |
| --- | --- |
| `pending` | Menunggu respons penjual |
| `accepted` | Pesanan diterima |
| `in_progress` | Sedang dikerjakan |
| `completed` | Selesai |
| `rejected` | Ditolak |
| `cancelled` | Dibatalkan |

Status labels must remain consistent throughout the buyer and seller interfaces.

Color must not be the only distinction between states. Include readable text and, where useful, a small icon.

Only render permitted actions based on the order state and current actor. Backend validation remains authoritative.

## 18. Admin Dashboard

The admin dashboard should emphasize clarity, safe operations, and review efficiency.

Potential areas:

- Seller application queue.
- Admin-access request queue.
- Service moderation queue.
- Account-management tools.
- Moderation history.
- Role-audit history.

Requirements:

- Distinguish pending and reviewed records.
- Show relevant context before an administrative decision.
- Require confirmation for sensitive or destructive actions.
- Require a reason when the underlying contract requires one.
- Display a clear result after an action.
- Avoid accidental double submission.
- Prevent unauthorized users from accessing administrative pages.
- Never rely on route hiding as the only security measure.

Audit details must be shown only to authorized administrators.

## 19. Forms, Dialogs, and Feedback

All forms must provide:

- Labels.
- Clear required-field indications.
- Field-level validation messages.
- Submission progress.
- Success feedback.
- Recoverable error feedback.

Destructive or sensitive actions should use confirmation dialogs when appropriate.

Dialogs must:

- Have an accessible name.
- Support keyboard interaction.
- Keep focus within the dialog while open.
- Return focus to the triggering element when closed.
- Provide an explicit cancel option.

Use notifications for brief results, but do not rely on disappearing notifications as the only place where important errors are explained.

Do not use browser alerts for routine application feedback unless there is a documented reason.

## 20. Loading, Empty, Error, and Disabled States

Every data-driven page must define its behavior for:

- Initial loading.
- Empty results.
- Failed requests.
- Expired or invalid sessions.
- Permission errors.
- Successful updates.
- Disabled actions.
- Unavailable resources.

Requirements:

- Avoid indefinite spinners.
- Provide retry actions when retry is safe.
- Preserve user input when a recoverable request fails.
- Explain permission failures without exposing private data.
- Do not treat a network error as proof that an operation failed on the server; account for retry safety where relevant.
- Do not display success until the relevant backend operation succeeds.

## 21. Responsive Behavior

The interface must support:

- Desktop layouts.
- Tablet layouts.
- Narrow mobile layouts.

At minimum, verify representative widths around:

- `360px`
- `390px`
- `768px`
- `1024px`
- `1440px`

These are test targets, not exclusive supported sizes.

Requirements:

- No unintended horizontal scrolling.
- Navigation adapts to available width.
- Service cards reflow cleanly.
- Tables use an appropriate responsive pattern.
- Forms remain readable and usable.
- Primary actions remain discoverable.
- Touch targets are adequately sized.
- Text and images do not overlap at common zoom levels.

## 22. Accessibility

Follow semantic HTML and practical WCAG-aligned accessibility principles.

Requirements:

- All essential controls must be keyboard accessible.
- Focus indicators must remain visible.
- Form inputs must have labels.
- Images must have appropriate alternative text.
- Decorative images must not create redundant screen-reader output.
- Contrast must be checked.
- Error messages must be programmatically associated with their inputs where practical.
- Dynamic feedback must be communicated accessibly.
- Use semantic buttons and links according to their purpose.
- Respect reduced-motion preferences for nonessential animation.

Accessibility must be considered during component implementation, not added only at the end.

## 23. Motion and Interaction

Motion should clarify state and hierarchy rather than distract.

Use restrained transitions for:

- Hover and focus feedback.
- Menu opening and closing.
- Dialog presentation.
- Card interaction.
- Loading feedback.

Avoid long or excessive animations.

Do not make essential information dependent on animation.

Respect reduced-motion settings.

## 24. Reusable Component System

Build reusable components where repeated patterns justify them.

Potential components:

- `Button`
- `Input`
- `Textarea`
- `Select`
- `FormField`
- `Badge`
- `ServiceCard`
- `PriceDisplay`
- `StatusBadge`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `ConfirmDialog`
- `PageHeader`
- `Pagination`, if pagination is implemented
- `ImageUploader`

Each component must have a clear purpose, predictable props, and accessible behavior.

Avoid building an unnecessarily large component framework for a small MVP.

Shared components must not hide business logic that belongs in application services or backend validation.

## 25. Implementation Rules

- Use the design tokens defined in CSS.
- Reuse existing components before creating duplicates.
- Keep page components focused on composition and interaction.
- Keep API calls in a defined API-client layer.
- Do not put credentials or privileged logic in frontend code.
- Do not fabricate data to make unfinished features look complete.
- Do not implement UI actions without a defined API operation or explicitly labeled prototype state.
- Do not silently change product requirements to simplify the interface.
- Document intentional deviations and obtain approval for scope changes.

## 26. UI Acceptance Criteria

The UI is ready for review when:

1. Public browsing and service discovery work against real application data.
2. Authentication forms show correct validation and feedback.
3. Buyer, seller, and admin navigation reflects the authenticated role.
4. Service cards and detail pages display consistent service information.
5. Cart and checkout states match backend results.
6. Order statuses and available actions match the API contract.
7. Forms, dialogs, and navigation are keyboard operable.
8. Loading, empty, error, and success states are implemented.
9. Representative mobile and desktop widths have been tested.
10. No fake ratings, testimonials, or unsupported metrics appear.
11. No protected operation relies exclusively on frontend authorization.
12. Automated checks and relevant manual tests have been run and reported honestly.

This document describes intended UI behavior. It does not prove that any screen or feature has already been implemented.
