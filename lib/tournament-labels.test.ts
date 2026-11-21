import { describe, expect, it } from 'vitest';
import { allowedTransitions, formatDay, isTournamentClosed, isTournamentLocked, requiresConfirmation } from './tournament-labels';

describe('allowedTransitions', () => {
    it('desde PLANNED solo abre inscripciones o cancela', () => {
        expect(allowedTransitions('PLANNED')).toEqual(['REGISTRATION_OPEN', 'CANCELLED']);
    });

    it('desde REGISTRATION_OPEN solo inicia o cancela', () => {
        expect(allowedTransitions('REGISTRATION_OPEN')).toEqual(['IN_PROGRESS', 'CANCELLED']);
    });

    it('desde IN_PROGRESS solo finaliza o cancela', () => {
        expect(allowedTransitions('IN_PROGRESS')).toEqual(['FINISHED', 'CANCELLED']);
    });

    it('FINISHED y CANCELLED no tienen transiciones', () => {
        expect(allowedTransitions('FINISHED')).toEqual([]);
        expect(allowedTransitions('CANCELLED')).toEqual([]);
    });
});

describe('reglas de estado', () => {
    it('pide confirmación solo para FINISHED y CANCELLED', () => {
        expect(requiresConfirmation('FINISHED')).toBe(true);
        expect(requiresConfirmation('CANCELLED')).toBe(true);
        expect(requiresConfirmation('IN_PROGRESS')).toBe(false);
    });

    it('bloquea nombre, deporte y fechas desde IN_PROGRESS', () => {
        expect(isTournamentLocked('PLANNED')).toBe(false);
        expect(isTournamentLocked('REGISTRATION_OPEN')).toBe(false);
        expect(isTournamentLocked('IN_PROGRESS')).toBe(true);
        expect(isTournamentLocked('FINISHED')).toBe(true);
        expect(isTournamentLocked('CANCELLED')).toBe(true);
    });

    it('marca como cerrado únicamente FINISHED y CANCELLED', () => {
        expect(isTournamentClosed('PLANNED')).toBe(false);
        expect(isTournamentClosed('REGISTRATION_OPEN')).toBe(false);
        expect(isTournamentClosed('IN_PROGRESS')).toBe(false);
        expect(isTournamentClosed('FINISHED')).toBe(true);
        expect(isTournamentClosed('CANCELLED')).toBe(true);
        expect(isTournamentClosed(undefined)).toBe(false);
    });
});

describe('formatDay', () => {
    it('convierte YYYY-MM-DD a dd/mm/aaaa sin correr el día', () => {
        expect(formatDay('2026-12-01')).toBe('01/12/2026');
        expect(formatDay(null)).toBe('Sin fecha');
    });
});
