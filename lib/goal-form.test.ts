import { describe, expect, it } from 'vitest';
import {
    filterMatchEligiblePlayers,
    toCreateGoalPayload,
    toGoalFormValues,
    toRecordMatchResultPayload,
    toUpdateGoalPayload,
    validateGoalForm,
    validateMatchResultForm
} from './goal-form';
import { Goal, Match, TeamPlayer } from '@/types/sports';

describe('validateMatchResultForm', () => {
    it('exige marcadores enteros no negativos', () => {
        expect(validateMatchResultForm(null, -1)).toEqual({
            homeScore: 'El marcador local es obligatorio y debe ser entero',
            awayScore: 'El marcador visitante no puede ser negativo'
        });
        expect(validateMatchResultForm(2, 1)).toEqual({});
        expect(toRecordMatchResultPayload(2, 1)).toEqual({ homeScore: 2, awayScore: 1 });
    });
});

describe('goal-form', () => {
    it('valida campos obligatorios y rangos de minuto, puntos y descripción', () => {
        const errors = validateGoalForm({
            playerId: null,
            minute: 305,
            points: 0,
            description: 'x'.repeat(201)
        });

        expect(errors).toEqual({
            playerId: 'Selecciona el jugador que anotó',
            minute: 'El minuto debe estar entre 0 y 300',
            points: 'Los puntos deben estar entre 1 y 10',
            description: 'La descripción no puede superar los 200 caracteres'
        });
    });

    it('construye payloads de creación y actualización parcial sin campos sin cambios', () => {
        const createPayload = toCreateGoalPayload(12, {
            playerId: 4,
            minute: 37,
            points: 1,
            description: '  Tiro libre  '
        });
        expect(createPayload).toEqual({
            matchId: 12,
            playerId: 4,
            minute: 37,
            points: 1,
            description: 'Tiro libre'
        });

        const existing: Goal = {
            id: 9,
            minute: 37,
            points: 1,
            description: 'Tiro libre',
            recordedAt: '2026-11-20T18:00:00.000Z',
            match: {
                id: 12,
                scheduledAt: '2026-11-20T17:00:00.000Z',
                status: 'IN_PROGRESS',
                homeTeam: { id: 1, name: 'Local' },
                awayTeam: { id: 2, name: 'Visitante' }
            },
            player: {
                id: 4,
                fullName: 'Carlos Pérez',
                documentNumber: '123',
                position: 'Delantero'
            }
        };

        const values = toGoalFormValues(existing);
        expect(toUpdateGoalPayload(values, existing)).toEqual({});
        expect(toUpdateGoalPayload({ ...values, minute: 42, description: '' }, existing)).toEqual({
            minute: 42,
            description: null
        });
    });

    it('filtra jugadores con contrato vigente o activo en la fecha del partido sin duplicados', () => {
        const match: Pick<Match, 'scheduledAt' | 'homeTeam' | 'awayTeam'> = {
            scheduledAt: '2026-11-20T18:00:00.000Z',
            homeTeam: { id: 10, name: 'Tigres' },
            awayTeam: { id: 20, name: 'Águilas' }
        };

        const contracts: TeamPlayer[] = [
            {
                id: 1,
                team: { id: 10, name: 'Tigres', city: 'Bogotá', modality: 'MALE' },
                player: { id: 101, fullName: 'Ana Ruiz', documentNumber: '1', position: 'Base', age: 23 },
                startDate: '2026-01-01',
                endDate: '2026-12-31',
                status: 'ACTIVE',
                stage: 'CURRENT',
                releaseDate: null,
                releaseReason: null
            },
            {
                id: 2,
                team: { id: 20, name: 'Águilas', city: 'Cali', modality: 'MALE' },
                player: { id: 102, fullName: 'Luis Mora', documentNumber: '2', position: 'Delantero', age: 25 },
                startDate: '2026-01-01',
                endDate: '2026-10-01',
                status: 'RELEASED',
                stage: 'PAST',
                releaseDate: '2026-09-15',
                releaseReason: 'CONTRACT_ENDED'
            },
            {
                id: 3,
                team: { id: 30, name: 'Otro', city: 'Medellín', modality: 'MALE' },
                player: { id: 103, fullName: 'Pedro Paz', documentNumber: '3', position: 'Portero', age: 28 },
                startDate: '2026-01-01',
                endDate: '2026-12-31',
                status: 'ACTIVE',
                stage: 'CURRENT',
                releaseDate: null,
                releaseReason: null
            }
        ];

        const options = filterMatchEligiblePlayers(contracts, match);
        expect(options).toEqual([{ label: 'Ana Ruiz · Tigres (Base)', value: 101, teamName: 'Tigres' }]);
    });
});
