import { describe, expect, it } from 'vitest';
import { EMPTY_MATCH_FORM, playableVenues, toCreateMatchPayload, toMatchFormValues, toUpdateMatchPayload, validateMatchForm } from './match-form';
import { FIELD_HEIGHT, FIELD_WIDTH, playerInitials, secondsSince, toField } from './board-geometry';
import { Match, TournamentVenue, Venue } from '@/types/sports';

const MATCH: Match = {
    id: 1,
    scheduledAt: '2026-11-21T20:00:00.000Z',
    status: 'SCHEDULED',
    homeScore: null,
    awayScore: null,
    bettingOpen: true,
    phase: { id: 3, name: 'Fase de grupos', type: 'GROUP', label: 'Grupo A', tournament: { id: 6, name: 'Liga' } },
    homeTeam: { id: 1, name: 'Atlético' },
    awayTeam: { id: 2, name: 'Deportivo' },
    venue: { id: 4, name: 'Estadio' },
    ball: { id: 9, brand: 'Golty', model: 'Pro' }
};

const venue = (id: number, parentId: number | null, active = true): Venue => ({
    id,
    name: `V${id}`,
    address: null,
    active,
    parent: parentId ? { id: parentId, name: `V${parentId}` } : null,
    locationsCount: 0,
    totalCapacity: 0
});

describe('validateMatchForm', () => {
    it('exige todos los campos', () => {
        expect(Object.keys(validateMatchForm(EMPTY_MATCH_FORM))).toHaveLength(7);
    });

    it('no deja que un equipo juegue contra sí mismo', () => {
        expect(validateMatchForm({ ...toMatchFormValues(MATCH), awayTeamId: 1 }).awayTeamId).toContain('contra sí mismo');
    });
});

describe('payloads de partido', () => {
    it('envía la fecha en ISO 8601', () => {
        expect(toCreateMatchPayload(toMatchFormValues(MATCH)).scheduledAt).toBe(MATCH.scheduledAt);
    });

    it('al editar solo envía lo que cambió', () => {
        expect(toUpdateMatchPayload(toMatchFormValues(MATCH), MATCH)).toEqual({});
        expect(toUpdateMatchPayload({ ...toMatchFormValues(MATCH), venueId: 5 }, MATCH)).toEqual({ venueId: 5 });
    });
});

describe('playableVenues', () => {
    it('incluye los habilitados y sus espacios internos activos', () => {
        const venues = [venue(1, null), venue(2, 1), venue(3, 2), venue(4, null), venue(5, 1, false)];
        const enabled = [{ venue: { id: 1 } } as TournamentVenue];
        expect(playableVenues(venues, enabled).map((v) => v.id)).toEqual([1, 2, 3]);
    });
});

describe('geometría de la pizarra', () => {
    it('convierte porcentajes a la cancha y recorta fuera de rango', () => {
        expect(toField({ x: 50, y: 50 })).toEqual({ cx: FIELD_WIDTH / 2, cy: FIELD_HEIGHT / 2 });
        expect(toField({ x: 120, y: -5 })).toEqual({ cx: FIELD_WIDTH, cy: 0 });
    });

    it('arma iniciales y segundos desde el último registro', () => {
        expect(playerInitials('Juan  Pérez Gómez')).toBe('JP');
        expect(secondsSince('2026-11-19T10:00:00.000Z', Date.parse('2026-11-19T10:00:05.000Z'))).toBe(5);
    });
});
