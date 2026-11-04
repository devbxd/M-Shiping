// House ads for the owner's other businesses. Edit text / links here.
export type Ad = {
  id: string;
  brand: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  image?: string;
  bg: string;
  fg: string;
  accent: string;
};

export const ADS: Ad[] = [
  {
    id: "cyber",
    brand: "M&S Cyber Systems",
    title: "Want a store like this one?",
    text: "Websites, online stores, dashboards and AI for businesses in Lebanon and Kuwait.",
    cta: "mscybersystem.site",
    href: "https://mscybersystem.site/?ref=mshopping",
    image: "/ads/mshopping.jpg",
    bg: "#0a0a0a",
    fg: "#ffffff",
    accent: "#a3a3a3",
  },
  {
    id: "invoicing",
    brand: "M&S Agency Invoicing",
    title: "Run your travel agency on one system",
    text: "Quotes, invoices, tickets, hotels, visas and payments. Used every day by six agencies.",
    cta: "See the system",
    href: "https://mscybersystem.site/project.html?p=invoicing&ref=mshopping",
    image: "/ads/dash-msia.jpg",
    bg: "#0f2a4a",
    fg: "#ffffff",
    accent: "#9fb6d4",
  },
  {
    id: "whitesky",
    brand: "White Sky Travel",
    title: "Flights, hotels and visas, Lebanon ⇄ Kuwait",
    text: "Offices in Kuwait City and Cheka. Tell them where you want to go, they handle the rest.",
    cta: "whiteskytravelsagency.com",
    href: "https://whiteskytravelsagency.com/?ref=mshopping",
    image: "/ads/whitesky.jpg",
    bg: "#0b1426",
    fg: "#ffffff",
    accent: "#d4af6a",
  },
];
