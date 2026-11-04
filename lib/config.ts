// Single place for brand + business rules. Rename the shop here.
export const SHOP = {
  name: "M&Shopping",
  tagline: "Everything, delivered to Lebanon.",
  currency: "USD",
  whatsapp: "+961 71 335 614",
  whatsappLink: "https://wa.me/96171335614",
  email: "boudytwitch@gmail.com",
};

// Delivery inside Lebanon, charged once per order.
export const DELIVERY = {
  fee: 4,
  freeAbove: 60,
  estimate: "10–18 days",
};

export type Department = {
  slug: string;
  name: string;
  blurb: string;
};

export const DEPARTMENTS: Department[] = [
  { slug: "women", name: "Women", blurb: "Dresses, tops, bags and jewellery" },
  { slug: "men", name: "Men", blurb: "Shirts, watches and essentials" },
  { slug: "shoes", name: "Shoes", blurb: "Sneakers, heels, everyday pairs" },
  { slug: "tech", name: "Tech", blurb: "Phones, laptops, tablets, accessories" },
  { slug: "beauty", name: "Beauty", blurb: "Skin care, make-up, fragrance" },
  { slug: "home", name: "Home", blurb: "Furniture, decor and kitchen" },
  { slug: "sport", name: "Sport", blurb: "Training gear and outdoor" },
  { slug: "kids", name: "Kids", blurb: "Clothes, toys and school" },
  { slug: "accessories", name: "Accessories", blurb: "Sunglasses and small things" },
];

export function departmentName(slug: string) {
  return DEPARTMENTS.find((d) => d.slug === slug)?.name ?? slug;
}
