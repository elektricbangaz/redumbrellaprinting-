# Red Umbrella Printing — Implementation Roadmap

## Current-state assessment

### Already present
- Public landing page.
- Create Studio.
- Cart and order submission.
- Product data model.
- Customer model.
- Order and order-item models.
- Design model.
- WiPay / Fygaro payment integration scaffolding.
- Admin authentication.
- Orders admin.
- Work-order board.
- Purchase orders.
- Newsletter subscribers.
- Broadcast email tooling.
- Resend integration.

### Partial / immature
- Product catalog UI.
- Product management.
- Customer CRM.
- Payment reconciliation.
- Work-order lifecycle.
- Order status model.
- Artwork approval workflow.
- Customer tracking experience.
- Transactional email family.
- Mobile admin.
- Visual design system.
- Quote workflow.
- Receivables.
- Reporting.

### Missing
- Quote model and quote-to-order conversion.
- Invoice model.
- Payment transaction ledger.
- Partial payments / balance tracking.
- Customer communication timeline.
- Supplier records.
- Inventory / stock.
- File / artwork asset model.
- Approval history.
- Status event log.
- Due-date / SLA logic.
- Automated reminders.
- Dashboard / KPI layer.
- Role-based permissions beyond basic ADMIN / STAFF.

## Phase 0 — Professional visual system
Goal: remove the "amateurish" feel without changing the approved information architecture.

Tasks:
- Introduce production typography system: display + UI fonts.
- Replace emoji/glyph-based UI with one icon library.
- Normalize spacing, radii, button heights, card borders, shadows, form states.
- Improve header, footer, product cards, CTA hierarchy, cart, and checkout polish.
- Add hover / focus / loading / empty / error / success states.
- Ensure mobile layouts are designed rather than collapsed desktop layouts.
- Keep all approved photographic assets.

Acceptance:
- Landing and Create remain compositionally faithful to approved mockups.
- No SVG product mockups.
- No inconsistent icon styles.
- No default browser-looking controls.

## Phase 1 — Data-model foundation
Goal: make one job lifecycle drive the entire business.

Add:
- Quote
- QuoteItem
- Invoice
- InvoiceItem
- PaymentTransaction
- JobStatusEvent
- CustomerNote
- FileAsset
- Supplier
- InventoryItem
- InventoryTransaction

Revise:
- OrderStatus
- WorkOrderStage
- Customer
- Product

Important:
- Maintain migrations safely.
- No destructive migration without explicit review.

## Phase 2 — Quote workflow
- Public quote form.
- Admin quote inbox.
- Quote builder.
- Send quote by email.
- Approve / decline.
- Convert approved quote to order.
- Preserve artwork and customer data through conversion.

## Phase 3 — Checkout and payment hardening
- Production-safe WiPay / Fygaro callback verification.
- Idempotent payment transactions.
- Remove / strictly gate dev-only mark-paid endpoint.
- Partial-payment support.
- Receipts.
- Failed payment handling.
- Balance due.

## Phase 4 — Production operations
- Artwork review stage.
- Production scheduling.
- Due dates.
- Staff assignment.
- Priority.
- Quality check.
- Ready / completed.
- Internal notes.
- Customer-visible status updates.

## Phase 5 — CRM and receivables
- Customer profile.
- Orders / quotes / invoices timeline.
- Outstanding balances.
- Aging buckets.
- Payment reminders.
- Manual follow-up notes.
- Communication history.

## Phase 6 — Inventory and procurement
- Supplier directory.
- Blank stock and materials.
- Reorder levels.
- Purchase order receiving.
- Stock movements.
- Job-linked material consumption.

## Phase 7 — Marketing
- Subscriber segmentation.
- Customer segmentation.
- Broadcast templates.
- Promotional offers.
- Campaign history.
- Unsubscribe controls.
- Optional abandoned-cart / quote follow-up.

## Phase 8 — Reporting
Dashboard metrics:
- sales
- quotes won / lost
- outstanding receivables
- jobs due
- jobs late
- production throughput
- best-selling products
- repeat customers
- payment method split
- gross margin where costs are available

## Immediate implementation sequence
1. Professionalize the design system.
2. Lock public visual primitives.
3. Audit production payment endpoints.
4. Expand job lifecycle enums and status history.
5. Build Quote model and public quote intake.
6. Build Customers admin.
7. Build Payments / Receivables admin.
8. Expand production board.
