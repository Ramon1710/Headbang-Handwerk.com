export const ZOLLHAUS_PARTNER_SITE_ID = 'zollhaus';
export const ZOLLHAUS_FIRESTORE_ROOT_PATH = `partnerSites/${ZOLLHAUS_PARTNER_SITE_ID}`;
export const ZOLLHAUS_PRODUCTS_COLLECTION_PATH = `${ZOLLHAUS_FIRESTORE_ROOT_PATH}/products`;
export const ZOLLHAUS_ORDERS_COLLECTION_PATH = `${ZOLLHAUS_FIRESTORE_ROOT_PATH}/orders`;
export const ZOLLHAUS_SETTINGS_DOCUMENT_PATH = `${ZOLLHAUS_FIRESTORE_ROOT_PATH}/settings/shop`;
export const ZOLLHAUS_ORDER_REQUESTS_COLLECTION_PATH = `${ZOLLHAUS_FIRESTORE_ROOT_PATH}/orderRequests`;

export type ZollhausProductStatus = 'active' | 'inactive' | 'archived';
export type ZollhausOrderStatus = 'new' | 'email_sent' | 'email_failed' | 'invoiced' | 'shipped' | 'cancelled';
export type ZollhausManagedOrderStatus = 'new' | 'invoiced' | 'shipped' | 'cancelled';
export type ZollhausOrderEmailState = 'pending' | 'sending' | 'sent' | 'failed';
export type ZollhausOrderEmailErrorCategory = 'not_configured' | 'transport_error' | 'invalid_recipient' | 'unknown';
export type ZollhausOrderRequestState = 'started' | 'completed' | 'failed';
export type ZollhausAdminActorRole = 'headbang-admin' | 'zollhaus-admin';

export interface ZollhausProductImage {
  id: string;
  storagePath: string;
  url: string;
  alt: string;
  sortOrder: number;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface ZollhausProduct {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  stockQuantity: number;
  images: ZollhausProductImage[];
  status: ZollhausProductStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  archivedBy?: string;
  archivedByRole?: ZollhausAdminActorRole;
  restoredAt?: string;
  restoredBy?: string;
  restoredByRole?: ZollhausAdminActorRole;
}

export interface ZollhausShopSettings {
  id: 'shop';
  shopName: string;
  currencyCode: 'EUR';
  orderNumberPrefix: string;
  checkoutEnabled: boolean;
  supportEmail: string;
  checkoutShippingNotice: string;
  checkoutInvoiceNotice: string;
  checkoutLegalNotice: string;
  checkoutSubmitButtonLabel: string;
  checkoutConfirmationNotice: string;
  createdAt: string;
  updatedAt: string;
}

export interface ZollhausOrderCustomer {
  firstName: string;
  lastName: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
}

export interface ZollhausOrderProductSnapshot {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  status: ZollhausProductStatus;
  primaryImageAlt?: string;
}

export interface ZollhausOrderItem {
  productId: string;
  quantity: number;
  productSnapshot: ZollhausOrderProductSnapshot;
  productName: string;
  unitPriceCents: number;
  primaryImageAlt?: string;
}

export interface ZollhausOrderEmailStatus {
  state: ZollhausOrderEmailState;
  attemptCount: number;
  lastAttemptAt?: string;
  sentAt?: string;
  lastErrorCategory?: ZollhausOrderEmailErrorCategory;
  lastErrorMessage?: string;
  providerMessageId?: string;
  sendingClaimId?: string;
  sendingClaimedAt?: string;
}

export interface ZollhausOrder {
  id: string;
  orderNumber: string;
  status: ZollhausOrderStatus;
  customer: ZollhausOrderCustomer;
  items: ZollhausOrderItem[];
  totalPriceCents: number;
  idempotencyKey: string;
  email: ZollhausOrderEmailStatus;
  customerEmail: ZollhausOrderEmailStatus;
  createdAt: string;
  updatedAt: string;
  statusUpdatedAt?: string;
  statusUpdatedBy?: string;
  statusUpdatedByRole?: ZollhausAdminActorRole;
  cancelledAt?: string;
  stockRestoredAt?: string;
  stockRestoredBy?: string;
  stockRestoredByRole?: ZollhausAdminActorRole;
}

export interface ZollhausOrderRequest {
  idempotencyKey: string;
  requestHash: string;
  status: ZollhausOrderRequestState;
  orderId?: string;
  orderNumber?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  lastError?: string;
}
