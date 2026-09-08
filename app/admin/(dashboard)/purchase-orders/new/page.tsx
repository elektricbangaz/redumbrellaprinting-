import { NewPurchaseOrderForm } from "./NewPurchaseOrderForm";

export default function NewPurchaseOrderPage() {
  return (
    <>
      <div className="admin-header">
        <div>
          <h1>New Purchase Order</h1>
          <p>Order blanks, ink, or materials from a vendor.</p>
        </div>
      </div>
      <div className="admin-card">
        <NewPurchaseOrderForm />
      </div>
    </>
  );
}
