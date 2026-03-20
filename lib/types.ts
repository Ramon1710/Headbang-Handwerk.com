export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  festivalName: string;
  description: string;
  status: 'planned' | 'confirmed' | 'completed';
  ctaText: string;
  ctaUrl?: string;
  imageUrl?: string;
}

export interface SponsorPackage {
  id: string;
  name: string;
  price: number;
  features: string[];
  visibility: string;
  logoSize: string;
  placement: string;
  highlighted: boolean;
}

export interface BannerSlot {
  id: string;
  name: string;
  position: string;
  size: string;
  price: number;
  visibilityLevel: string;
  available: 'available' | 'reserved' | 'sold';
  previewImage?: string;
  description: string;
}

export interface MerchandiseProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  description: string;
  variants: {
    size?: string[];
    color?: string[];
  };
  inStock: boolean;
  badge?: string;
}

export interface ContactRequest {
  name: string;
  company: string;
  email: string;
  subject: string;
  message: string;
  interests: string[];
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  sponsorPackageId?: string;
  productId?: string;
  createdAt: string;
  companyName?: string;
}

export interface DonationReceipt {
  id: string;
  paymentId: string;
  companyName: string;
  address: string;
  amount: number;
  date: string;
  purpose: string;
  receiptNumber: string;
  status: 'open' | 'created' | 'sent';
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

export interface Order {
  id: string;
  products: OrderItem[];
  totalAmount: number;
  customerEmail: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: string;
}
