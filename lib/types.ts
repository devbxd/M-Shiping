export type Supplier = "aliexpress" | "cj" | "demo";

export type Product = {
  id: string;
  title: string;
  brand?: string;
  department: string;
  category: string;
  price: number; // our selling price (USD)
  compareAt?: number; // crossed-out price, optional
  cost: number; // what we pay the supplier, shipping included (USD)
  supplier: Supplier;
  supplierUrl?: string;
  supplierId?: string;
  images: string[];
  rating?: number;
  reviews?: number;
  description: string;
  createdAt: string;
};

export type OrderStatus =
  | "pending" // received, waiting for our validation
  | "confirmed" // we called/WhatsApp'd the customer, order is real
  | "purchased" // we bought it from the supplier
  | "shipped" // on its way to Lebanon / out for delivery
  | "delivered"
  | "cancelled";

export type OrderItem = {
  productId: string;
  title: string;
  image: string;
  price: number;
  cost: number;
  qty: number;
  supplier: Supplier;
  supplierUrl?: string;
};

export type Order = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  customer: {
    name: string;
    phone: string;
    email?: string;
    city: string;
    address: string;
    notes?: string;
  };
  payment: "cod" | "whish";
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  total: number;
  supplierOrderRef?: string;
  tracking?: string;
  adminNote?: string;
  history: { at: string; status: OrderStatus; note?: string }[];
};
