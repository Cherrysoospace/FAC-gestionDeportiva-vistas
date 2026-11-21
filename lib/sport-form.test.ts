import { describe, expect, it } from 'vitest';
import { Sport } from '@/types/sports';
import { toCreateSportPayload, toSportFormValues, toUpdateSportPayload, validateSportForm } from './sport-form';

const sport: Sport = { id: 2, name: 'Fútbol sala', description: null, active: true, parent: { id: 1, name: 'Fútbol', active: true } };

describe('sport-form', () => {
    it('valida nombre y descripción', () => {
        const errors = validateSportForm({ name: ' ', description: 'x'.repeat(256), parentId: null, active: true });
        expect(errors.name).toBeDefined();
        expect(errors.description).toBeDefined();
    });

    it('construye el payload de creación sin campos vacíos', () => {
        expect(toCreateSportPayload({ name: ' Tenis ', description: '  ', parentId: null, active: true })).toEqual({ name: 'Tenis' });
        expect(toCreateSportPayload({ name: 'Sala', description: 'x', parentId: 1, active: true })).toEqual({ name: 'Sala', description: 'x', parentId: 1 });
    });

    it('en la edición envía solo lo cambiado y null para volver raíz', () => {
        const values = toSportFormValues(sport);
        expect(toUpdateSportPayload(values, sport)).toEqual({});
        expect(toUpdateSportPayload({ ...values, parentId: null, active: false }, sport)).toEqual({ parentId: null, active: false });
    });
});

