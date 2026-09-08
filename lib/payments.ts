// Payment gateway integration for WiPay and Fygaro (Caribbean/Jamaican processors).
//
// Both providers require a live merchant account and API credentials before a
// real charge can be initiated. Until WIPAY_* / FYGARO_* env vars are set,
// checkout falls back to an internal "payment stub" page at /pay/[orderNumber]
// so the full order flow (cart -> checkout -> paid -> work order) can be
// exercised end to end. Swap buildRedirectUrl's body for the real hosted
// checkout call once credentials are available.

export type PaymentProvider = "WIPAY" | "FYGARO";

export type PaymentRedirectInput = {
  provider: PaymentProvider;
  orderNumber: string;
  totalCents: number;
  currency: string;
  customerEmail: string;
  customerName: string;
};

function isWiPayConfigured() {
  return Boolean(process.env.WIPAY_ACCOUNT_NUMBER && process.env.WIPAY_API_KEY);
}

function isFygaroConfigured() {
  return Boolean(process.env.FYGARO_MERCHANT_ID && process.env.FYGARO_API_KEY);
}

/**
 * Returns the URL the shopper should be sent to in order to pay.
 * Falls back to the internal stub checkout page when live credentials
 * are not configured for the chosen provider.
 */
export function buildRedirectUrl(input: PaymentRedirectInput): string {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const amount = (input.totalCents / 100).toFixed(2);

  if (input.provider === "WIPAY" && isWiPayConfigured()) {
    const params = new URLSearchParams({
      account_number: process.env.WIPAY_ACCOUNT_NUMBER!,
      total: amount,
      currency: input.currency,
      order_id: input.orderNumber,
      response_url: `${appUrl}/api/payments/wipay/callback`,
      customer_email: input.customerEmail,
      customer_name: input.customerName,
    });
    return `https://checkout.wipayfinancial.com/request?${params.toString()}`;
  }

  if (input.provider === "FYGARO" && isFygaroConfigured()) {
    const params = new URLSearchParams({
      merchant_id: process.env.FYGARO_MERCHANT_ID!,
      amount,
      currency: input.currency,
      reference: input.orderNumber,
      redirect_url: `${appUrl}/api/payments/fygaro/callback`,
    });
    return `https://pay.fygaro.com/checkout?${params.toString()}`;
  }

  return `${appUrl}/pay/${input.orderNumber}?provider=${input.provider}`;
}
