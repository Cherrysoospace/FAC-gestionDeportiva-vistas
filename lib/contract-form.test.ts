import { describe, expect, it } from 'vitest';
import { toContractFormValues, toCreateContractPayload, toReleasePayload, toUpdateContractPayload, validateContractForm, validateReleaseForm } from './contract-form';
import { TeamPlayer } from '@/types/sports';

const TODAY = new Date(2026, 10, 19);

const CONTRACT: TeamPlayer = {
    id: 7,
    team: { id: 1, name: 'Atlético', city: 'Manizales', modality: 'MALE' },
    player: { id: 4, fullName: 'Juan Pérez', documentNumber: '1053245678', position: 'DEL', age: 24 },
    startDate: '2026-01-01',
    endDate: '2027-12-31',
    status: 'ACTIVE',
    stage: 'CURRENT',
    releaseDate: null,
    releaseReason: null
};

describe('validateContractForm', () => {
    it('al asignar exige jugador y fechas', () => {
        expect(Object.keys(validateContractForm({ playerId: null, startDate: null, endDate: null }, false)).sort()).toEqual(['endDate', 'playerId', 'startDate']);
    });

    it('al editar no exige el jugador y la fecha de fin debe ser posterior', () => {
        expect(validateContractForm({ playerId: null, startDate: new Date(2027, 0, 1), endDate: new Date(2027, 0, 1) }, true)).toEqual({ endDate: 'La fecha de fin debe ser posterior a la de inicio' });
    });
});

describe('payloads de contrato', () => {
    it('al asignar envía equipo, jugador y fechas YYYY-MM-DD', () => {
        expect(toCreateContractPayload({ playerId: 4, startDate: new Date(2026, 0, 1), endDate: new Date(2027, 11, 31) }, 1)).toEqual({ teamId: 1, playerId: 4, startDate: '2026-01-01', endDate: '2027-12-31' });
    });

    it('al editar solo envía las fechas que cambiaron', () => {
        expect(toUpdateContractPayload(toContractFormValues(CONTRACT), CONTRACT)).toEqual({});
        expect(toUpdateContractPayload({ ...toContractFormValues(CONTRACT), endDate: new Date(2028, 5, 30) }, CONTRACT)).toEqual({ endDate: '2028-06-30' });
    });
});

describe('retiro de la plantilla', () => {
    it('exige el motivo y valida la fecha dentro del contrato y no futura', () => {
        expect(validateReleaseForm({ reason: null, releaseDate: null }, CONTRACT, TODAY)).toEqual({ reason: 'Selecciona el motivo de salida' });
        expect(validateReleaseForm({ reason: 'TRANSFERRED', releaseDate: new Date(2026, 11, 1) }, CONTRACT, TODAY).releaseDate).toContain('futura');
        expect(validateReleaseForm({ reason: 'TRANSFERRED', releaseDate: new Date(2025, 11, 31) }, CONTRACT, TODAY).releaseDate).toContain('dentro del contrato');
    });

    it('sin fecha deja que el backend use la de hoy', () => {
        expect(toReleasePayload({ reason: 'TRANSFERRED', releaseDate: null })).toEqual({ reason: 'TRANSFERRED' });
        expect(toReleasePayload({ reason: 'CONTRACT_ENDED', releaseDate: new Date(2026, 5, 30) })).toEqual({ reason: 'CONTRACT_ENDED', releaseDate: '2026-06-30' });
    });
});
