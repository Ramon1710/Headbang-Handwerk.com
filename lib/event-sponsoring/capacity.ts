import type {
  EventSponsoringBooking,
  EventSponsoringCapacityBySize,
  EventSponsoringLogoSlotSize,
  EventSponsoringSlot,
  EventSponsoringSlotOverlap,
  EventSponsoringSlotStatus,
  EventSponsoringSlotSize,
} from '@/lib/event-sponsoring/types';

function emptyCapacity(): EventSponsoringCapacityBySize {
  return {
    small: 0,
    medium: 0,
    large: 0,
  };
}

export interface EventSponsoringSlotStatusBreakdown {
  available: EventSponsoringCapacityBySize;
  blocked: EventSponsoringCapacityBySize;
  assigned: EventSponsoringCapacityBySize;
  active: EventSponsoringCapacityBySize;
}

function createStatusBreakdown(): EventSponsoringSlotStatusBreakdown {
  return {
    available: emptyCapacity(),
    blocked: emptyCapacity(),
    assigned: emptyCapacity(),
    active: emptyCapacity(),
  };
}

function isCapacityConsumingBookingStatus(status: EventSponsoringBooking['status']) {
  return (
    status === 'paid'
    || status === 'slot_selection_pending'
    || status === 'slot_assigned'
    || status === 'logo_uploaded'
    || status === 'under_review'
    || status === 'approved'
    || status === 'completed'
  );
}

export function getTotalCapacityBySize(slots: EventSponsoringSlot[]): EventSponsoringCapacityBySize {
  return slots.reduce((capacity, slot) => {
    if (!slot.active || slot.status === 'blocked') {
      return capacity;
    }

    capacity[slot.packageSize] += 1;
    return capacity;
  }, emptyCapacity());
}

export function getConsumedCapacityBySize(bookings: EventSponsoringBooking[]): EventSponsoringCapacityBySize {
  return bookings.reduce((capacity, booking) => {
    if (booking.slotSize === 'none' || booking.bookingType !== 'paid_logo' || !isCapacityConsumingBookingStatus(booking.status)) {
      return capacity;
    }

    capacity[booking.slotSize] += 1;
    return capacity;
  }, emptyCapacity());
}

export function getSellableCapacityBySize(slots: EventSponsoringSlot[], bookings: EventSponsoringBooking[]): EventSponsoringCapacityBySize {
  const total = slots.reduce((capacity, slot) => {
    if (!slot.active || slot.status !== 'available') {
      return capacity;
    }

    capacity[slot.packageSize] += 1;
    return capacity;
  }, emptyCapacity());
  const consumed = getConsumedCapacityBySize(bookings);

  return {
    small: Math.max(0, total.small - consumed.small),
    medium: Math.max(0, total.medium - consumed.medium),
    large: Math.max(0, total.large - consumed.large),
  };
}

export function canSellAnotherPackageOfSize(size: EventSponsoringSlotSize, slots: EventSponsoringSlot[], bookings: EventSponsoringBooking[]) {
  return getSellableCapacityBySize(slots, bookings)[size] > 0;
}

export function doesSlotMatchBooking(slot: EventSponsoringSlot, booking: EventSponsoringBooking) {
  if (!slot.active || booking.slotSize === 'none') {
    return false;
  }

  if (booking.bookingType !== 'paid_logo') {
    return false;
  }

  if (slot.eventId !== booking.eventId) {
    return false;
  }

  if (slot.packageSize !== booking.slotSize) {
    return false;
  }

  if (slot.status === 'blocked') {
    return false;
  }

  if (slot.status === 'assigned' && slot.bookingId !== booking.id) {
    return false;
  }

  return true;
}

function rangesOverlap(startA: number, lengthA: number, startB: number, lengthB: number) {
  return startA < startB + lengthB && startB < startA + lengthA;
}

export function findOverlappingActiveSlots(slots: EventSponsoringSlot[]): EventSponsoringSlotOverlap[] {
  const overlaps: EventSponsoringSlotOverlap[] = [];
  const activeSlots = slots.filter((slot) => slot.active);

  for (let index = 0; index < activeSlots.length; index += 1) {
    const current = activeSlots[index];

    for (let compareIndex = index + 1; compareIndex < activeSlots.length; compareIndex += 1) {
      const candidate = activeSlots[compareIndex];

      if (candidate.bannerId !== current.bannerId) {
        continue;
      }

      const overlapsHorizontally = rangesOverlap(current.x, current.width, candidate.x, candidate.width);
      const overlapsVertically = rangesOverlap(current.y, current.height, candidate.y, candidate.height);

      if (overlapsHorizontally && overlapsVertically) {
        overlaps.push({
          bannerId: current.bannerId,
          firstSlotId: current.id,
          secondSlotId: candidate.id,
        });
      }
    }
  }

  return overlaps;
}

export function getSlotStatusBreakdownBySize(slots: EventSponsoringSlot[]): EventSponsoringSlotStatusBreakdown {
  return slots.reduce((summary, slot) => {
    if (!slot.active) {
      return summary;
    }

    summary.active[slot.packageSize] += 1;
    summary[slot.status][slot.packageSize] += 1;
    return summary;
  }, createStatusBreakdown());
}

export function countSlotsByStatus(slots: EventSponsoringSlot[], status: EventSponsoringSlotStatus) {
  return slots.filter((slot) => slot.active && slot.status === status).length;
}

export function normalizeBookingSlotSizeForKind(kind: EventSponsoringBooking['packageKind']): EventSponsoringLogoSlotSize {
  if (kind === 'small_logo') {
    return 'small';
  }

  if (kind === 'medium_logo') {
    return 'medium';
  }

  if (kind === 'large_logo') {
    return 'large';
  }

  return 'none';
}
