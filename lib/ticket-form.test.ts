import { describe, expect, it } from 'vitest';
import { MatchTicketAvailability } from '@/types/sports';
import {
    availabilityTag,
    canCancelTicket,
    canPurchaseTicketForMatch,
    createEmptyTicketForm,
    occupancyPercentage,
    toCreateTicketPayload,
    toPurchaseTicketPayload,
    validateTicketForm
} from './ticket-form';

const sampleAvailability: MatchTicketAvailability = {
    matchId: 10,
    matchStatus: 'SCHEDULED',
    scheduledAt: '2026-11-28T20:00:00.000Z',
    venueId: 3,
    venueName: 'Estadio Palogrande',
    totalCapacity: 100,
    totalSold: 92,
    totalAvailable: 8,
    locations: [
        { locationId: 1, locationName: 'Oriental', active: true, capacity: 50, sold: 50, available: 0, soldOut: true },
        { locationId: 2, locationName: 'Occidental', active: true, capacity: 30, sold: 26, available: 4, soldOut: false },
        { locationId: 3, locationName: 'Norte', active: true, capacity: 20, sold: 4, available: 16, soldOut: false },
        { locationId: 4, locationName: 'Sur', active: false, capacity: 10, sold: 0, available: 10, soldOut: false }
    ]
};

describe('ticket-form', () => {
    it('restringe compra y cancelación a partidos SCHEDULED y calcula ocupación', () => {
        expect(canPurchaseTicketForMatch('SCHEDULED')).toBe(true);
        expect(canPurchaseTicketForMatch('IN_PROGRESS')).toBe(false);
        expect(canCancelTicket('SCHEDULED')).toBe(true);
        expect(canCancelTicket('FINISHED')).toBe(false);

        expect(occupancyPercentage(50, 100)).toBe(50);
        expect(occupancyPercentage(0, 0)).toBe(0);

        expect(availabilityTag(sampleAvailability.locations[0])).toEqual({ label: 'Agotada', severity: 'danger' });
        expect(availabilityTag(sampleAvailability.locations[1])).toEqual({ label: 'Últimos cupos', severity: 'warning' });
        expect(availabilityTag(sampleAvailability.locations[2])).toEqual({ label: 'Disponible', severity: 'success' });
        expect(availabilityTag(sampleAvailability.locations[3])).toEqual({ label: 'Inactiva', severity: 'info' });
    });

    it('valida localidad agotada, inactiva o ajena al escenario del partido', () => {
        const soldOutValues = { ...createEmptyTicketForm(10, 1), price: 50000 };
        expect(validateTicketForm(soldOutValues, false, sampleAvailability).locationId).toContain('no tiene cupos');

        const inactiveValues = { ...createEmptyTicketForm(10, 4) };
        expect(validateTicketForm(inactiveValues, false, sampleAvailability).locationId).toContain('inactiva');

        const missingLocation = { ...createEmptyTicketForm(10, 999) };
        expect(validateTicketForm(missingLocation, false, sampleAvailability).locationId).toContain('no pertenece');

        const validValues = { ...createEmptyTicketForm(10, 2), fanId: 7, price: 85000.5 };
        expect(validateTicketForm(validValues, true, sampleAvailability)).toEqual({});
    });

    it('construye payloads de compra propia y emisión administrativa', () => {
        const values = { fanId: 7, matchId: 10, locationId: 3, price: 45000 };
        expect(toPurchaseTicketPayload(values)).toEqual({ matchId: 10, locationId: 3, price: 45000 });
        expect(toCreateTicketPayload(values)).toEqual({ fanId: 7, matchId: 10, locationId: 3, price: 45000 });

        const freeTicket = { fanId: 7, matchId: 10, locationId: 3, price: null };
        expect(toPurchaseTicketPayload(freeTicket)).toEqual({ matchId: 10, locationId: 3 });
    });
});

