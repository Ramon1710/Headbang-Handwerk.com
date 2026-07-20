export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  festivalName: string;
  description: string;
  status: 'planned' | 'confirmed' | 'completed';
  standEnabled?: boolean;
  ctaText: string;
  ctaUrl?: string;
  imageUrl?: string;
  stand?: EventStandConfig;
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

export interface EventStandConfig {
  assetUrl: string;
  assetName: string;
  assetContentType: string;
  lead?: string;
  bannerSlots: BannerSlot[];
}

export interface MerchandiseProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  galleryImageUrls?: string[];
  sizes?: string[];
  colors?: string[];
  badge?: string;
  estimatedDeliveryTime?: string;
  stripePriceId?: string;
}

export interface MerchandiseCartItem {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface MerchandiseCheckoutCustomer {
  firstName: string;
  lastName: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
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
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  billingStreet?: string;
  billingHouseNumber?: string;
  billingPostalCode?: string;
  billingCity?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface GameHighScoreRecord {
  name: string;
  score: number;
}

export interface GameLeaderboardEntry {
  id: string;
  name: string;
  score: number;
  level: number;
  timeUp: boolean;
  createdAt: string;
}

export interface GameLeaderboardResponse {
  highScore: GameHighScoreRecord | null;
  topEntries: GameLeaderboardEntry[];
}
