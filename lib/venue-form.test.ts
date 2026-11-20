import { describe, expect, it } from 'vitest';
import { toCreateVenuePayload, toUpdateVenuePayload, toVenueFormValues, validateVenueForm } from './venue-form';
import { Venue } from '@/types/sports';

const VENUE: Venue = {
    id: 5,
    name: 'Cancha 1',
    address: null,
    active: true,
    parent: { id: 1, name: 'Complejo Palogrande' },
    locationsCount: 2,
    totalCapacity: 3000
};

describe('validateVenueForm', () => {
    it('exige el nombre y limita la dirección', () => {
        expect(validateVenueForm({ name: '', address: 'x'.repeat(201), parentId: null, active: true })).toEqual({
            name: 'El nombre es obligatorio',
            address: 'La dirección no puede superar los 200 caracteres'
        });
    });
});

describe('payloads de escenario', () => {
    it('dirección vacía se envía como null y se conserva el padre', () => {
        expect(toCreateVenuePayload(toVenueFormValues(null, 1))).toEqual({ name: '', address: null, parentId: 1 });
    });

    it('al editar solo envía lo que cambió; quitar el padre envía null', () => {
        expect(toUpdateVenuePayload(toVenueFormValues(VENUE), VENUE)).toEqual({});
        expect(toUpdateVenuePayload({ ...toVenueFormValues(VENUE), parentId: null, address: 'Cra 23' }, VENUE)).toEqual({ parentId: null, address: 'Cra 23' });
    });
});
