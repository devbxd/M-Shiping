export function money(n: number) {
  return "$" + n.toFixed(2);
}

export function date(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_LABEL: Record<string, string> = {
  pending: "To validate",
  confirmed: "Confirmed",
  purchased: "Bought from supplier",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
