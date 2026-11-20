import { describe, expect, it } from 'vitest';
import { ageOn, EMPTY_PLAYER_FORM, PlayerFormValues, toCreatePlayerPayload, toPlayerFormValues, toUpdatePlayerPayload, validatePlayerForm } from './player-form';
import { formatHeight, normalizeDocument } from './player-labels';
import { Player } from '@/types/sports';

const TODAY = new Date(2026, 10, 19);

const PLAYER: Player = {
    id: 4,
    fullName: 'Juan Pérez',
    documentNumber: '1053245678',
    birthDate: '2002-05-10',
    age: 24,
    nationality: 'Colombia',
    position: 'DEL',
    heightCm: 180,
    dominantFoot: 'RIGHT',
    active: true,
    currentTeams: []
};

const VALID: PlayerFormValues = toPlayerFormValues(PLAYER);

describe('validatePlayerForm', () => {
    it('exige los campos obligatorios', () => {
        const errors = validatePlayerForm(EMPTY_PLAYER_FORM, TODAY);
        expect(Object.keys(errors).sort()).toEqual(['birthDate', 'documentNumber', 'fullName', 'heightCm', 'nationality', 'position']);
    });

    it('acepta el documento con puntos (se normaliza) y rechaza caracteres inválidos', () => {
        expect(validatePlayerForm({ ...VALID, documentNumber: '1.053.245.678' }, TODAY)).toEqual({});
        expect(validatePlayerForm({ ...VALID, documentNumber: '12#45' }, TODAY).documentNumber).toBeDefined();
    });

    it('valida fecha futura, edad y altura como el backend', () => {
        expect(validatePlayerForm({ ...VALID, birthDate: new Date(2026, 10, 20) }, TODAY).birthDate).toContain('futura');
        expect(validatePlayerForm({ ...VALID, birthDate: new Date(1940, 0, 1) }, TODAY).birthDate).toContain('entre 5 y 80');
        expect(validatePlayerForm({ ...VALID, heightCm: 99 }, TODAY).heightCm).toContain('entre 100 y 250');
    });
});

describe('payloads de jugador', () => {
    it('normaliza el documento y envía la fecha como YYYY-MM-DD', () => {
        expect(toCreatePlayerPayload({ ...VALID, documentNumber: '1.053 245.678', fullName: ' Juan Pérez ' })).toMatchObject({ fullName: 'Juan Pérez', documentNumber: '1053245678', birthDate: '2002-05-10' });
    });

    it('al editar solo envía lo que cambió; quitar el pie dominante envía null', () => {
        expect(toUpdatePlayerPayload(VALID, PLAYER)).toEqual({});
        expect(toUpdatePlayerPayload({ ...VALID, dominantFoot: null, heightCm: 182 }, PLAYER)).toEqual({ dominantFoot: null, heightCm: 182 });
    });
});

describe('utilidades', () => {
    it('calcula la edad según si ya cumplió años', () => {
        expect(ageOn(new Date(2000, 10, 19), TODAY)).toBe(26);
        expect(ageOn(new Date(2000, 10, 20), TODAY)).toBe(25);
    });

    it('formatea altura y documento', () => {
        expect(formatHeight(180)).toBe('1,80 m');
        expect(normalizeDocument(' cc 1.234-5 ')).toBe('CC1234-5');
    });
});
