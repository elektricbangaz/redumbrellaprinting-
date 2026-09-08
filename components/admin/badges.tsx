const ORDER_STATUS_CLASS: Record<string, string> = {
  PENDING_PAYMENT: "badge-amber",
  PAID: "badge-blue",
  IN_PRODUCTION: "badge-blue",
  READY_FOR_PICKUP: "badge-green",
  COMPLETED: "badge-green",
  CANCELLED: "badge-red",
};

const PAYMENT_STATUS_CLASS: Record<string, string> = {
  UNPAID: "badge-grey",
  PENDING: "badge-amber",
  PAID: "badge-green",
  FAILED: "badge-red",
  REFUNDED: "badge-grey",
};

const STAGE_CLASS: Record<string, string> = {
  QUEUED: "badge-grey",
  IN_PROGRESS: "badge-blue",
  QUALITY_CHECK: "badge-amber",
  COMPLETED: "badge-green",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${ORDER_STATUS_CLASS[status] ?? "badge-grey"}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${PAYMENT_STATUS_CLASS[status] ?? "badge-grey"}`}>
      {status}
    </span>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={`badge ${STAGE_CLASS[stage] ?? "badge-grey"}`}>
      {stage.replaceAll("_", " ")}
    </span>
  );
}
