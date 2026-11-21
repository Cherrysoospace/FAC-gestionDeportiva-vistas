import { describe, expect, it } from 'vitest';
import { Ball } from '@/types/sports';
import { toBallFormValues, toCreateBallPayload, toUpdateBallPayload, validateBallForm } from './ball-form';

const ball: Ball = { id: 1, brand: 'Adidas', model: 'Tango', size: '5', active: true, matchId: null };

describe('ball-form', () => {
    it('valida marca, modelo y talla', () => {
        const errors = validateBallForm({ brand: ' ', model: 'x'.repeat(81), size: 'x'.repeat(21), active: true });
        expect(errors.brand).toBeDefined();
        expect(errors.model).toBeDefined();
        expect(errors.size).toBeDefined();
    });

    it('construye el payload de creación sin talla vacía', () => {
        expect(toCreateBallPayload({ brand: ' Nike ', model: 'Flight', size: ' ', active: true })).toEqual({ brand: 'Nike', model: 'Flight' });
        expect(toCreateBallPayload({ brand: 'Nike', model: 'Flight', size: '4', active: true })).toEqual({ brand: 'Nike', model: 'Flight', size: '4' });
    });

    it('en la edición envía solo lo cambiado y null para borrar la talla', () => {
        const values = toBallFormValues(ball);
        expect(toUpdateBallPayload(values, ball)).toEqual({});
        expect(toUpdateBallPayload({ ...values, size: '', active: false }, ball)).toEqual({ size: null, active: false });
    });
});
