import { describe, expect, it } from 'vitest';
import {
    normalizeFanDocument,
    toAdminFanFormValues,
    toCreateFanPayload,
    toMyFanFormValues,
    toRegisterMyFanPayload,
    toUpdateFanPayload,
    toUpdateMyFanPayload,
    validateAdminFanForm,
    validateMyFanForm
} from './fan-form';
import { Fan } from '@/types/sports';

const SAMPLE_FAN: Fan = {
    id: 3,
    securityUserId: 15,
    fullName: 'Laura Gómez',
    documentNumber: '1053800123',
    email: 'laura@ejemplo.com',
    phone: '3001234567',
    active: true,
    createdAt: '2026-11-20T10:00:00.000Z',
    favoriteTeamsCount: 2
};

describe('fan-form', () => {
    it('normaliza documento y valida campos requeridos en registro administrativo', () => {
        expect(normalizeFanDocument(' 1.053-800.abc ')).toBe('1053800ABC');

        const errors = validateAdminFanForm(
            {
                securityUserId: null,
                fullName: '',
                documentNumber: '',
                email: 'correo-invalido',
                phone: '1'.repeat(31),
                active: true
            },
            false
        );

        expect(errors).toEqual({
            securityUserId: 'El identificador del usuario de seguridad es obligatorio y debe ser entero positivo',
            fullName: 'El nombre completo es obligatorio',
            documentNumber: 'El documento es obligatorio',
            email: 'El correo electrónico no tiene un formato válido',
            phone: 'El teléfono no puede superar los 30 caracteres'
        });
    });

    it('genera payloads de creación y actualización administrativa solo con cambios', () => {
        const createPayload = toCreateFanPayload({
            securityUserId: 15,
            fullName: '  Laura Gómez ',
            documentNumber: '1.053.800.123',
            email: ' LAURA@EJEMPLO.COM ',
            phone: '  ',
            active: true
        });

        expect(createPayload).toEqual({
            securityUserId: 15,
            fullName: 'Laura Gómez',
            documentNumber: '1053800123',
            email: 'laura@ejemplo.com',
            phone: null
        });

        const initial = toAdminFanFormValues(SAMPLE_FAN);
        expect(toUpdateFanPayload(initial, SAMPLE_FAN)).toEqual({});
        expect(toUpdateFanPayload({ ...initial, active: false, phone: '' }, SAMPLE_FAN)).toEqual({
            active: false,
            phone: null
        });
    });

    it('valida y transforma formulario propio /me/fan sin incluir active', () => {
        expect(validateMyFanForm({ fullName: 'Ana', documentNumber: '998877', email: 'ana@mail.com', phone: '' })).toEqual({});

        const myValues = toMyFanFormValues(null, 'Ana', 'Ana@Mail.com');
        expect(toRegisterMyFanPayload({ ...myValues, documentNumber: '99.88.77' })).toEqual({
            fullName: 'Ana',
            documentNumber: '998877',
            email: 'ana@mail.com',
            phone: null
        });

        const editValues = toMyFanFormValues(SAMPLE_FAN);
        expect(toUpdateMyFanPayload({ ...editValues, fullName: 'Laura M. Gómez' }, SAMPLE_FAN)).toEqual({
            fullName: 'Laura M. Gómez'
        });
    });
});
