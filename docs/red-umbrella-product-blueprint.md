# Red Umbrella Printing — Product + Operations Blueprint

This document captures the agreed direction for the Red Umbrella Printing storefront, Create Studio, and operational backend. It is intentionally written as a product blueprint rather than calling the system an “operating system.”

## 1. Product principle

Red Umbrella should behave like one connected application across customer ordering, design, quoting, payments, production, and staff operations.

The customer-facing website is the storefront and design surface. The backend is the operational layer that receives approved work, routes it to production, tracks progress, stores invoices/designs, manages customers/supplies, and exposes the status of active jobs to staff.

The system must remain understandable and usable whether 3 people or 300 people are working in it.

---

## 2. Create Studio — canonical design architecture

The designer must use one canonical, versioned design state. The visual editor, 3D renderer, saved draft, final export, quote, and production record must all consume the same state rather than keeping separate versions of the design.

Core design state:

- product
- product variant / size
- garment or product colour
- supply mode: Red Umbrella supplied / customer supplied
- selected production method
- selected placement / print zone
- side / surface
- layers
  - text
  - uploaded artwork
  - stock art
- layer transform
  - x / y placement
  - width / scale
  - rotation
  - ordering / z-index
- text properties
  - font
  - colour
  - weight
  - style
  - alignment
  - wrapping width
- quantity
- pricing snapshot
- preview / export references
- schema version
- updated timestamp

The 2D interaction layer is the source of truth. The 3D renderer reflects the same design state in real time. Moving or resizing a layer must update a texture/material — it must not rebuild or reload the garment model.

### Interaction requirements

- true drag/drop upload
- tap/click to select a layer
- drag to move
- resize handles
- rotate handle
- duplicate
- delete
- layer ordering
- snap / alignment guides
- centre tools
- undo / redo
- front/back switching
- real-time 2D + 3D preview
- persistent draft recovery
- Google Fonts rendering from the selected font
- text wrapping is mandatory
- mobile touch gestures must use large touch targets and avoid control overlap

### Product-aware preview modes

- T-shirts / polos / hoodies: 3D garment model with mapped print surfaces
- mugs / bottles: cylindrical wrap preview
- banners / signs: preview canvas uses actual selected dimensions and aspect ratio
- vehicles: vehicle-specific templates and printable panels

A selected banner size must visibly change the design surface dimensions. A 24×36 item cannot use the same square preview surface as a 120×96 item.

---

## 3. Production method model

The designer must support production method as first-class job data rather than loose notes.

Initial methods captured from planning notes:

- Heat Transfer
- Embroidery
- DTF
- Screen Print
- UV Stickers
- Laser Engraving

Not every method applies to every product. The available choices must be filtered by product/material.

Examples:

- apparel: Heat Transfer, Embroidery, DTF, Screen Print
- promotional / rigid / metallic items: UV Stickers and Laser Engraving where applicable

The selected method must be stored with the completed design and visible to production staff.

---

## 4. Placement / print-zone model

Placement must be stored explicitly because placement affects production and pricing.

Initial apparel placements:

- Full Front
- Left Chest / Pocket Print
- Right Chest
- Full Back
- Upper Back
- Left Sleeve
- Right Sleeve
- Hem / Tail

The system must allow product-specific placements. A placement valid for a shirt should not automatically appear for a mug, banner, or vehicle.

Placement must map to a real editable surface in the visual preview. The customer should never be placing artwork against an arbitrary box that is disconnected from the actual printable area.

---

## 5. Pricing architecture

Pricing must be a rule engine, not a single hardcoded product price.

The pricing model must be able to consider:

- product
- whether Red Umbrella supplies the blank/product
- quantity
- production method
- placement
- front/back/multiple locations
- print dimensions / area
- selected size/template
- material
- finishing where applicable

The notes explicitly require that print size can determine cost, and that costing may be based on area for applicable print styles.

Where the current price list is incomplete, the app should route the configuration to a custom quote instead of inventing a price.

---

## 6. Customer completion flow

“Complete Design” is a production handoff, not only a screenshot.

A completed submission should preserve:

- original artwork files
- final artwork exports
- 3D / flat mockup preview
- exact layer positions
- scale / rotation
- selected fonts
- text content
- colours
- product
- selected placement(s)
- production method
- quantity
- supply mode
- pricing snapshot
- customer information
- submission timestamp
- design version

The customer should receive a clear confirmation explaining what happens next, not internal implementation notes.

Suggested customer-facing expectation:

> Your design has been submitted to Red Umbrella for production review. We’ll confirm artwork, specifications, pricing and the next production step before work begins.

---

## 7. Operational backend

### Dashboard

A clear summary of:

- active orders
- jobs waiting for approval
- jobs on the production floor
- jobs due today / overdue
- ready jobs
- unpaid invoices / outstanding balances
- low-stock or supply alerts
- recent customer activity

### Job Queue

When an order is approved, it should be able to move directly into the production-floor queue.

Queue items should show at minimum:

- job / order number
- customer
- product
- quantity
- production method
- placement
- due date / promised date
- current production stage
- assigned staff / workstation where relevant
- payment state
- priority

### Large Production Screen

The system should support a large-screen production view similar in principle to a fast-food kitchen order display.

This is not a second database. It is a live view of the same job queue.

The display should make it easy to see:

- waiting jobs
- in-progress jobs
- blocked / issue jobs
- ready jobs
- elapsed time / due time
- responsible station or team

### Staff tablet / workstation controls

Staff should be able to open a job and update its production state from a tablet or workstation.

Status changes should update the large production screen immediately.

The backend should support sign-in / sign-out or acknowledgement of jobs so the business can see who worked on or moved a job through the production line.

Suggested production flow:

1. Submitted
2. Review
3. Approved
4. Queued
5. In Production
6. Quality Check
7. Ready
8. Completed

Exception states:

- On Hold
- Needs Customer Approval
- Cancelled

### POS terminal

The POS should serve two related functions:

1. cash / card checkout for walk-in customers using the current Red Umbrella price rules
2. creation of an order/job that can move into the same production workflow

A walk-in order should not create a parallel operational process. Once confirmed, it becomes a normal order/job in the queue.

### Invoices

Dedicated invoice area containing all invoices with filters for:

- paid
- partially paid
- unpaid
- overdue
- cancelled / voided where applicable
- customer
- date
- order/job

### Designs archive

Dedicated design library, searchable by date/customer/job.

At minimum, design status should support:

- Pending
- Complete
- Cancelled

The archive should retain submitted mockups, original artwork, design state and production data.

### Customers

Customer records should connect:

- contact information
- previous designs
- quotes
- orders
- invoices
- payments
- outstanding balances
- communication history

### Supplies / inventory

The operational backend should eventually support supplies needed to complete jobs, with low-stock visibility and usage against production where practical.

---

## 8. Notifications

Notification channels captured in planning:

- WhatsApp
- Email

Notifications should be event-driven, for example:

- design received
- quote ready
- proof / approval required
- payment required
- order approved
- job ready
- invoice reminder

WhatsApp should be implemented through an approved WhatsApp Business provider/API rather than as a hardcoded link if automated outbound notifications are required.

---

## 9. Mobile / responsive application behaviour

The app must have a purpose-built mobile layout — not a desktop layout squeezed into a phone.

Create Studio mobile rules:

- canvas first
- fixed top controls for side + completion
- bottom app toolbar
- tools open as bottom sheets / drawers
- no horizontal overflow
- no tools covering the printable area
- 44–48px minimum touch targets
- drag gestures remain inside the active print area
- selected object handles remain usable without becoming larger than the artwork itself
- pinch / controlled zoom for the product view

Backend mobile/tablet rules:

- job cards optimized for touch
- quick status updates
- production queue usable from tablets
- POS optimized for counter use
- large-screen production view is a separate responsive mode rather than an enlarged admin page

---

## 10. Data architecture direction

Core entities expected as the backend grows:

- Customer
- Product
- ProductVariant
- PricingRule
- Design
- DesignVersion
- ArtworkAsset
- Quote
- Order
- OrderItem
- Job
- JobStatusEvent
- JobAssignment
- ProductionMethod
- PrintPlacement
- Invoice
- Payment
- StaffUser
- Workstation
- InventoryItem
- InventoryMovement
- Notification

The Job is the operational bridge between a confirmed order and the production floor.

The design is not the job, and the invoice is not the job. They are linked records with separate responsibilities.

---

## 11. Immediate engineering order

1. Finish the canonical design-state/rendering architecture.
2. Make the T-shirt editing experience correct on desktop and mobile.
3. Make 3D updates real-time without garment reloads.
4. Add persistent drafts + undo/redo.
5. Add method + placement as production metadata.
6. Finish reliable Complete Design persistence.
7. Apply the same engine to polo/hoodie/mug/banner/vehicle surfaces.
8. Build the production backend around Order → Job → Queue → Production → Completion.
9. Add POS, invoices, design archive and customer records.
10. Add WhatsApp/email notification workflows.

This ordering avoids building multiple disconnected interfaces before the core state and workflow are stable.
