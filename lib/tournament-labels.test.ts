import { describe, expect, it } from 'vitest';
import { allowedTransitions, formatDay, isRegistrationOpen, isTournamentClosed, isTournamentLocked, registrationBlockedMessage, registrationWindowState, requiresConfirmation, tournamentStatusDisplay } from './tournament-labels';

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

describe('periodo de inscripción', () => {
    const window = {
        status: 'REGISTRATION_OPEN' as const,
        registrationOpensAt: '2026-11-01T00:00:00Z',
        registrationClosesAt: '2026-11-20T23:59:00Z'
    };
    const before = new Date('2026-10-30T12:00:00Z');
    const during = new Date('2026-11-10T12:00:00Z');
    const after = new Date('2026-11-22T12:00:00Z');

    it('con estado abierto distingue antes, durante y después del rango', () => {
        expect(registrationWindowState(window, before)).toBe('NOT_YET_OPEN');
        expect(registrationWindowState(window, during)).toBe('OPEN');
        expect(registrationWindowState(window, after)).toBe('CLOSED');
        expect(isRegistrationOpen(window, during)).toBe(true);
        expect(isRegistrationOpen(window, after)).toBe(false);
    });

    it('si el periodo venció ya no dice "Inscripciones abiertas"', () => {
        expect(tournamentStatusDisplay(window, during).label).toBe('Inscripciones abiertas');
        expect(tournamentStatusDisplay(window, after).label).toBe('Inscripciones cerradas');
        expect(tournamentStatusDisplay(window, before).label).toBe('Inscripciones por abrir');
    });

    it('otros estados conservan su etiqueta y bloquean la inscripción', () => {
        const inProgress = { ...window, status: 'IN_PROGRESS' as const };
        expect(registrationWindowState(inProgress, during)).toBeNull();
        expect(tournamentStatusDisplay(inProgress, during).label).toBe('En curso');
        expect(registrationBlockedMessage(inProgress, during)).not.toBeNull();
    });

    it('explica por qué no se puede inscribir', () => {
        expect(registrationBlockedMessage(window, during)).toBeNull();
        expect(registrationBlockedMessage(window, after)).toContain('terminó');
        expect(registrationBlockedMessage(window, before)).toContain('abren');
    });
});
