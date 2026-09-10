# Red Umbrella Printing — Product Specification

## Product purpose
Red Umbrella Printing should function as both:
1. a premium customer-facing print ordering website, and
2. an internal operating system for managing customers, quotes, orders, production, payments, procurement, and marketing.

The public website should remove the need for fragmented ordering across WhatsApp, calls, email, and handwritten notes. The backend should turn each customer transaction into a structured operational workflow.

## Core problems to solve
- Customers do not have one consistent place to discover products, configure jobs, submit artwork, approve specifications, pay, and track progress.
- Staff need a single source of truth for customers, quotes, orders, artwork, payments, production status, and supplier requirements.
- Follow-up, reminders, invoices, production handoffs, and promotional outreach should not rely on memory or scattered conversations.
- Standard products and complex commercial jobs require different buying flows.

## Customer-facing system

### 1. Homepage
Purpose: present Red Umbrella as a professional full-service print factory.

Primary actions:
- Start Designing
- Browse Products
- Request a Custom Quote

Core categories:
- Apparel
- Promotional Items
- Signs & Displays
- Vehicle Graphics
- Banners & Prints

### 2. Create Studio
For standard customizable products.

Required workflow:
1. Select product.
2. Select color / size / quantity.
3. Upload artwork or add text.
4. Position artwork on front/back print areas.
5. Review preview and price.
6. Add to cart.
7. Enter customer details.
8. Pay.
9. Create order and production job automatically.

Future enhancement:
- 2D / 3D preview toggle. 2D remains the editing surface; 3D is for inspection.

### 3. Products
Product catalog with:
- category
- product images
- variants
- base price
- print options
- turnaround notes
- quantity pricing where applicable

### 4. Custom Quote
For jobs that cannot be priced reliably with a simple product configurator:
- custom signage
- routed signs
- acrylic / LED installations
- fleet vehicle graphics
- large-format jobs
- complex fabrication

Quote intake should capture:
- customer
- job type
- dimensions
- quantity
- material
- finishing
- installation requirements
- due date
- artwork/files
- notes
- budget range

### 5. Customer order status
Customers should be able to view:
- order number
- payment status
- artwork status
- production status
- expected completion / due date
- invoice / receipt

## Internal operating system

### Core job lifecycle
Lead → Quote → Approved → Awaiting Payment → Paid → Artwork Review → Production Queue → In Production → Quality Check → Ready → Delivered / Completed

This lifecycle should be the backbone of the backend.

### Customer records
Each customer should have:
- contact details
- company
- order history
- quote history
- outstanding balance
- notes
- files / artwork
- communication history

### Quotes
Required:
- quote number
- customer
- line items
- taxes / discounts if applicable
- validity period
- status
- approval
- conversion to order

Statuses:
Draft → Sent → Viewed → Approved → Declined → Expired → Converted

### Orders
Required:
- order number
- customer
- items
- artwork
- payment status
- production status
- delivery / collection method
- due date
- notes
- invoice / receipt

### Production
Work-order board should support:
Queued → Artwork Review → Ready for Production → In Progress → Quality Check → Ready → Completed

Each work order should show:
- order
- customer
- product
- quantity
- print method
- assigned staff
- due date
- priority
- artwork link
- notes

### Payments and receivables
Must support:
- unpaid / partial / paid
- payment provider
- reference
- invoice balance
- overdue amount
- reminders
- payment history

Important: "collection" in Red Umbrella's business context means accounts receivable / debt collection, not customer pickup.

### Invoicing
System should generate and track:
- quotes
- invoices
- receipts
- payment reminders
- balance statements

### Procurement
Purchase orders already exist and should mature into:
- supplier records
- PO status
- materials / blank stock
- expected delivery
- received quantities
- costs

### Marketing / CRM
Current broadcasts should evolve into:
- customer segments
- subscribers
- past customers
- lapsed customers
- campaign history
- promotional offers
- opt-out compliance

## Design principles
The approved mockups remain the visual source of truth.

The production UI should feel like a premium commercial print platform, not a template or student project.

Design rules:
- strong typography hierarchy
- disciplined spacing
- real photographic product mockups
- no generic SVG product placeholders
- no emoji or decorative glyphs as primary UI icons
- consistent icon set
- subtle borders and restrained shadows
- minimal visual noise
- clear customer task hierarchy
- desktop and mobile layouts designed intentionally
- all transactional states must be designed, not left as browser-default UI

## Product architecture
### Public
- /
- /products
- /products/[slug]
- /create
- /quote
- /cart
- /checkout
- /order/[orderNumber]
- /about
- /contact

### Admin
- /admin/dashboard
- /admin/customers
- /admin/quotes
- /admin/orders
- /admin/work-orders
- /admin/payments
- /admin/invoices
- /admin/purchase-orders
- /admin/products
- /admin/inventory
- /admin/broadcasts
- /admin/settings

## Non-negotiable system behavior
- One customer record should connect quotes, orders, payments, designs, and communications.
- An approved quote should convert to an order without re-entry.
- A paid order should create / activate the production work order.
- Production changes should update the customer-facing order status.
- Payment events must be idempotent.
- No production payment endpoint should allow a user to arbitrarily mark an order paid.
- Every meaningful status change should be timestamped.
