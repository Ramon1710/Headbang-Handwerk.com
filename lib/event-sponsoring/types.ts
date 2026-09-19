export const EVENT_SPONSORING_COLLECTIONS = {
  configs: 'eventSponsoringConfigs',
  packages: 'eventSponsoringPackages',
  banners: 'eventSponsoringBanners',
  slots: 'eventSponsoringSlots',
  bookings: 'eventSponsoringBookings',
  payments: 'eventSponsoringPayments',
  logoUploads: 'eventSponsoringLogoUploads',
  requests: 'eventSponsoringRequests',
} as const;

export type EventSponsoringCollectionName = (typeof EVENT_SPONSORING_COLLECTIONS)[keyof typeof EVENT_SPONSORING_COLLECTIONS];

export type EventSponsoringCurrencyCode = string;
export type EventSponsoringPackageKind = 'small_logo' | 'medium_logo' | 'large_logo' | 'custom_request' | 'anonymous_support';
export type EventSponsoringLogoSlotSize = 'small' | 'medium' | 'large' | 'none';
export type EventSponsoringSlotSize = Exclude<EventSponsoringLogoSlotSize, 'none'>;
export type EventSponsoringSlotStatus = 'available' | 'assigned' | 'blocked';
export type EventSponsoringBookingType = 'paid_logo' | 'custom_request' | 'anonymous_support';
export type EventSponsoringBookingStatus =
  | 'draft'
  | 'checkout_created'
  | 'payment_pending'
  | 'paid'
  | 'slot_selection_pending'
  | 'slot_assigned'
  | 'logo_uploaded'
  | 'under_review'
  | 'approved'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'refunded';
export type EventSponsoringPaymentProvider = 'stripe';
export type EventSponsoringPaymentStatus = 'created' | 'completed' | 'failed' | 'expired' | 'refunded' | 'partially_refunded';
export type EventSponsoringRequestSupportType =
  | 'material'
  | 'stand_construction'
  | 'interactive_activity'
  | 'tools_or_machines'
  | 'transport'
  | 'personnel'
  | 'financial'
  | 'other';
export type EventSponsoringRequestStatus = 'new' | 'invoice_pending' | 'invoice_sent' | 'accepted' | 'declined' | 'archived';
export type EventSponsoringRequestEmailState = 'pending' | 'sending' | 'sent' | 'failed';
export type EventSponsoringRequestEmailErrorCategory = 'not_configured' | 'transport_error' | 'unknown';
export type EventSponsoringLogoUploadStatus = 'pending' | 'uploaded' | 'under_review' | 'approved' | 'rejected';

export interface EventSponsoringConfig {
  eventId: string;
  enabled: boolean;
  publicTitle: string;
  publicDescription: string;
  currencyCode: EventSponsoringCurrencyCode;
  anonymousSupportEnabled: boolean;
  anonymousMinimumAmountCents: number;
  customSponsoringEnabled: boolean;
  showOccupiedLogosPublicly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventSponsoringPackage {
  id: string;
  eventId: string;
  name: string;
  kind: EventSponsoringPackageKind;
  description: string;
  features: string[];
  priceCents: number;
  currencyCode: EventSponsoringCurrencyCode;
  active: boolean;
  sortOrder: number;
  grantsBannerPlacement: boolean;
  logoSlotSize: EventSponsoringLogoSlotSize;
  isPaidOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventSponsoringBanner {
  id: string;
  eventId: string;
  name: string;
  widthMm: number;
  heightMm: number;
  sortOrder: number;
  active: boolean;
  layoutVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventSponsoringSlot {
  id: string;
  eventId: string;
  bannerId: string;
  slotCode: string;
  packageSize: EventSponsoringSlotSize;
  x: number;
  y: number;
  width: number;
  height: number;
  sortOrder: number;
  status: EventSponsoringSlotStatus;
  bookingId?: string;
  displayLabel: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventSponsoringBookingBillingAddress {
  company?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
}

export interface EventSponsoringCheckoutSponsorDetails {
  companyName: string;
  companyWebsite?: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone?: string;
  billingStreet: string;
  billingHouseNumber: string;
  billingPostalCode: string;
  billingCity: string;
  billingCountryCode: string;
  confirmDataAccurate: boolean;
  acceptDataProcessing: boolean;
  acceptPostPaymentFlow: boolean;
  publicDisplayConsent: boolean;
}

export interface EventSponsoringBooking {
  id: string;
  eventId: string;
  packageId: string;
  packageKind: EventSponsoringPackageKind;
  bookingType: EventSponsoringBookingType;
  slotSize: EventSponsoringLogoSlotSize;
  companyName?: string;
  companyWebsite?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactName: string;
  email: string;
  phone?: string;
  billingAddress?: EventSponsoringBookingBillingAddress;
  priceCents: number;
  currencyCode: EventSponsoringCurrencyCode;
  status: EventSponsoringBookingStatus;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  checkoutIdempotencyKeyHash?: string;
  checkoutRequestHash?: string;
  capacityHoldExpiresAt?: string;
  stripeCheckoutExpiresAt?: string;
  selectedSlotId?: string;
  publicDisplayEnabled: boolean;
  anonymousSupport: boolean;
  secureAccessTokenHash?: string;
  secureAccessTokenExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  cancelledAt?: string;
}

export interface EventSponsoringPayment {
  id: string;
  bookingId: string;
  eventId: string;
  provider: EventSponsoringPaymentProvider;
  checkoutSessionId: string;
  paymentIntentId?: string;
  status: EventSponsoringPaymentStatus;
  amountTotalCents: number;
  currencyCode: EventSponsoringCurrencyCode;
  processedWebhookEventIds: string[];
  metadataSnapshot: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  refundedAt?: string;
}

export interface EventSponsoringRequest {
  id: string;
  eventId: string;
  packageId: string;
  packageKind: EventSponsoringPackageKind;
  packageNameSnapshot: string;
  packageFeaturesSnapshot: string[];
  packagePriceCents?: number;
  currencyCode?: EventSponsoringCurrencyCode;
  companyName: string;
  companyWebsite?: string;
  contactFirstName: string;
  contactLastName: string;
  contactName: string;
  billingAddress: EventSponsoringBookingBillingAddress;
  email: string;
  phone: string;
  supportTypes: EventSponsoringRequestSupportType[];
  message?: string;
  publicDisplayEnabled: boolean;
  anonymousSupport: boolean;
  acceptDataProcessing: boolean;
  acceptInvoicePayment: boolean;
  acceptManualLogoPlacement: boolean;
  logoUploadId?: string;
  idempotencyKeyHash?: string;
  requestHash?: string;
  status: EventSponsoringRequestStatus;
  emailDelivery: {
    state: EventSponsoringRequestEmailState;
    attemptCount: number;
    lastAttemptAt?: string;
    sentAt?: string;
    lastErrorCategory?: EventSponsoringRequestEmailErrorCategory;
    lastErrorMessage?: string;
    providerMessageId?: string;
    sendingClaimId?: string;
    sendingClaimedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EventSponsoringLogoUpload {
  id: string;
  bookingId?: string;
  requestId?: string;
  eventId: string;
  slotId?: string;
  storageBucket?: string;
  storagePath: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  imageWidth?: number;
  imageHeight?: number;
  status: EventSponsoringLogoUploadStatus;
  uploadedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface EventSponsoringCapacityBySize {
  small: number;
  medium: number;
  large: number;
}

export interface EventSponsoringSlotOverlap {
  bannerId: string;
  firstSlotId: string;
  secondSlotId: string;
}
