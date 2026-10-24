import test from 'node:test';
import assert from 'node:assert/strict';
import { getUpcomingEvents, HOMEPAGE_EVENTS_PREVIEW_LIMIT } from '@/lib/events';
import type { Event } from '@/lib/types';

const REFERENCE_DATE = '2026-10-24';

function buildEvent(overrides: Partial<Event>): Event {
  return {
    id: overrides.id || `event-${Math.random().toString(36).slice(2, 10)}`,
    title: overrides.title || 'Testveranstaltung',
    date: overrides.date || 'Datum folgt',
    location: overrides.location || 'Testort',
    festivalName: overrides.festivalName || 'Testfestival',
    description: overrides.description || 'Beschreibung',
    status: overrides.status || 'confirmed',
    ctaText: overrides.ctaText || 'Mehr erfahren',
    ...overrides,
  };
}

test('Startseiten-Vorschau ist auf die naechsten drei Veranstaltungen begrenzt', () => {
  const events = [
    buildEvent({ id: 'e1', title: 'Eins', startDate: '2027-01-10' }),
    buildEvent({ id: 'e2', title: 'Zwei', startDate: '2026-11-05' }),
    buildEvent({ id: 'e3', title: 'Drei', startDate: '2026-12-01' }),
    buildEvent({ id: 'e4', title: 'Vier', startDate: '2027-03-15' }),
    buildEvent({ id: 'e5', title: 'Fuenf', startDate: '2026-10-30' }),
  ];

  const preview = getUpcomingEvents(events, { limit: HOMEPAGE_EVENTS_PREVIEW_LIMIT, referenceDate: REFERENCE_DATE });

  assert.equal(preview.length, 3);
  assert.deepEqual(
    preview.map((event) => event.id),
    ['e5', 'e2', 'e3']
  );
});

test('ohne Limit werden alle vorschaufaehigen Veranstaltungen geliefert', () => {
  const events = [
    buildEvent({ id: 'e1', startDate: '2027-01-10' }),
    buildEvent({ id: 'e2', startDate: '2026-11-05' }),
    buildEvent({ id: 'e3', startDate: '2026-12-01' }),
    buildEvent({ id: 'e4', startDate: '2027-03-15' }),
    buildEvent({ id: 'e5', startDate: '2026-10-30' }),
  ];

  const eligible = getUpcomingEvents(events, { referenceDate: REFERENCE_DATE });

  assert.equal(eligible.length, 5);
});

test('vergangene, abgesagte und undatierte Veranstaltungen sind nicht vorschaufaehig', () => {
  const events = [
    buildEvent({ id: 'zukuenftig', startDate: '2026-12-01' }),
    buildEvent({ id: 'vergangen', startDate: '2026-10-01', endDate: '2026-10-02' }),
    buildEvent({ id: 'abgesagt', startDate: '2026-12-01', status: 'cancelled' }),
    buildEvent({ id: 'ohne-datum' }),
    buildEvent({ id: 'ungueltiges-datum', startDate: '2026-13-40' }),
    buildEvent({ id: 'laeuft-noch', startDate: '2026-10-20', endDate: '2026-10-24' }),
  ];

  const eligible = getUpcomingEvents(events, { referenceDate: REFERENCE_DATE });

  assert.deepEqual(
    eligible.map((event) => event.id),
    ['laeuft-noch', 'zukuenftig']
  );
});

test('mehrtaegige Veranstaltung ohne Enddatum gilt am Starttag als kommend', () => {
  const events = [buildEvent({ id: 'heute', startDate: '2026-10-24' })];

  const eligible = getUpcomingEvents(events, { referenceDate: REFERENCE_DATE });

  assert.equal(eligible.length, 1);
});
