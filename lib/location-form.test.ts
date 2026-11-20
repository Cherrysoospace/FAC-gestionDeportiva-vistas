import { describe, expect, it } from 'vitest';
import { toCreateLocationPayload, toLocationFormValues, toUpdateLocationPayload, validateLocationForm } from './location-form';
import { Location } from '@/types/sports';

const LOCATION: Location = { id: 9, name: 'Norte', capacity: 1500, active: true, venue: { id: 5, name: 'Cancha 1' } };

describe('validateLocationForm', () => {
    it('valida la capacidad como el backend', () => {
        expect(validateLocationForm({ name: 'Sur', capacity: null, active: true }).capacity).toBe('La capacidad es obligatoria');
        expect(validateLocationForm({ name: 'Sur', capacity: 0, active: true }).capacity).toContain('al menos 1');
        expect(validateLocationForm({ name: 'Sur', capacity: 200001, active: true }).capacity).toContain('no puede superar');
        expect(validateLocationForm({ name: 'Sur', capacity: 800, active: true })).toEqual({});
    });

    it('exige el nombre', () => {
        expect(validateLocationForm({ name: ' ', capacity: 10, active: true }).name).toBe('El nombre es obligatorio');
    });
});

describe('payloads de localidad', () => {
    it('al crear incluye el escenario y recorta el nombre', () => {
        expect(toCreateLocationPayload({ name: ' VIP ', capacity: 200, active: true }, 5)).toEqual({ venueId: 5, name: 'VIP', capacity: 200 });
    });

    it('al editar solo envía lo que cambió', () => {
        expect(toUpdateLocationPayload(toLocationFormValues(LOCATION), LOCATION)).toEqual({});
        expect(toUpdateLocationPayload({ ...toLocationFormValues(LOCATION), capacity: 1800 }, LOCATION)).toEqual({ capacity: 1800 });
    });
});
