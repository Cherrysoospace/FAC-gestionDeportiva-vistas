import { describe, expect, it } from 'vitest';
import { Bet } from '@/types/sports';
import {
    calculatePotentialPayout,
    canModifyOrCancelMyBet,
    canVoidBetByAdmin,
    createEmptyBetForm,
    toBetFormValues,
    toCancelBetPayload,
    toCreateBetPayload,
    toPlaceBetPayload,
    toUpdateMyBetPayload,
    validateBetForm,
    validateCancelBetReason
} from './bet-form';

const sampleBet: Bet = {
    id: 14,
    selection: 'HOME_WIN',
    amount: 50000,
    odds: 2.25,
    potentialPayout: 112500,
    status: 'PENDING',
    payout: null,
    placedAt: '2026-11-21T10:00:00.000Z',
    settledAt: null,
    settlementNote: null,
    match: {
        id: 8,
        scheduledAt: '2026-11-28T20:00:00.000Z',
        status: 'SCHEDULED',
        bettingOpen: true,
        homeScore: null,
        awayScore: null,
        homeTeamName: 'Once Caldas',
        awayTeamName: 'Nacional',
        venueName: 'Estadio Palogrande',
        tournamentId: 1,
        tournamentName: 'Liga BetPlay'
    },
    fan: {
        id: 5,
        fullName: 'Fercho',
        documentNumber: '1053800123',
        email: 'fercho@correo.com'
    },
    paymentMethod: {
        id: 3,
        alias: 'Visa personal',
        reference: '1234',
        paymentMethodId: 1,
        paymentMethodName: 'Tarjeta',
        paymentMethodType: 'CARD'
    }
};

describe('bet-form', () => {
    it('calcula ganancia potencial y evalúa permisos de edición/cancelación/anulación', () => {
        expect(calculatePotentialPayout(50000, 2.25)).toBe(112500);
        expect(calculatePotentialPayout(null, 2)).toBe(0);

        expect(canModifyOrCancelMyBet(sampleBet)).toBe(true);
        expect(canVoidBetByAdmin(sampleBet)).toBe(true);

        const startedBet: Bet = {
            ...sampleBet,
            match: { ...sampleBet.match, status: 'IN_PROGRESS', bettingOpen: false }
        };
        expect(canModifyOrCancelMyBet(startedBet)).toBe(false);
        expect(canVoidBetByAdmin(startedBet)).toBe(true);

        const settledBet: Bet = { ...sampleBet, status: 'WON', payout: 112500 };
        expect(canModifyOrCancelMyBet(settledBet)).toBe(false);
        expect(canVoidBetByAdmin(settledBet)).toBe(false);
    });

    it('valida creación y preserva la cuota fija al editar', () => {
        const invalid = validateBetForm(createEmptyBetForm(), { editing: false, requireFan: true });
        expect(invalid.fanId).toBeDefined();
        expect(invalid.matchId).toBeDefined();
        expect(invalid.fanPaymentMethodId).toBeDefined();
        expect(invalid.amount).toBeDefined();

        const badOdds = { ...createEmptyBetForm(8, 3), amount: 20000, odds: 1.0 };
        expect(validateBetForm(badOdds, { editing: false, requireFan: false }).odds).toContain('1.01');

        const valid = { ...createEmptyBetForm(8, 3), fanId: 5, amount: 25000, odds: 2.1 };
        expect(validateBetForm(valid, { editing: false, requireFan: true })).toEqual({});
        expect(toPlaceBetPayload(valid)).toEqual({
            matchId: 8,
            fanPaymentMethodId: 3,
            selection: 'HOME_WIN',
            amount: 25000,
            odds: 2.1
        });
        expect(toCreateBetPayload(valid)).toEqual({
            fanId: 5,
            matchId: 8,
            fanPaymentMethodId: 3,
            selection: 'HOME_WIN',
            amount: 25000,
            odds: 2.1
        });

        const editValues = toBetFormValues(sampleBet);
        editValues.selection = 'DRAW';
        editValues.amount = 80000;
        editValues.odds = 9.99; // No debe enviarse en actualización
        const patchPayload = toUpdateMyBetPayload(editValues, sampleBet);
        expect(patchPayload).toEqual({ selection: 'DRAW', amount: 80000 });
        expect('odds' in patchPayload).toBe(false);
    });

    it('valida el motivo de cancelación o anulación', () => {
        expect(validateCancelBetReason('Cambio de pronóstico')).toBeNull();
        expect(validateCancelBetReason('x'.repeat(256))).toContain('255');
        expect(toCancelBetPayload('   ')).toEqual({});
        expect(toCancelBetPayload('  Partido reprogramado  ')).toEqual({ reason: 'Partido reprogramado' });
    });
});

