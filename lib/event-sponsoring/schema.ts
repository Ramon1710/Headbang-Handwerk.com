import {
  EVENT_SPONSORING_COLLECTIONS,
  type EventSponsoringCollectionName,
} from '@/lib/event-sponsoring/types';

export const DEFAULT_EVENT_SPONSORING_CURRENCY_CODE = 'EUR';
export const DEFAULT_EVENT_SPONSORING_BANNER_WIDTH_MM = 2000;
export const DEFAULT_EVENT_SPONSORING_BANNER_HEIGHT_MM = 1000;
export const MAX_ACTIVE_EVENT_SPONSORING_BANNERS_PER_EVENT = 2;

export function getEventSponsoringCollectionName(name: keyof typeof EVENT_SPONSORING_COLLECTIONS): EventSponsoringCollectionName {
  return EVENT_SPONSORING_COLLECTIONS[name];
}
