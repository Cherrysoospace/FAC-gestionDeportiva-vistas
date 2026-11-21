import { describe, expect, it } from 'vitest';
import { FinalPhase, GroupPhase } from '@/types/sports';
import {
    toCreateFinalPhasePayload,
    toCreateGroupPhasePayload,
    toFinalPhaseFormValues,
    toGroupPhaseFormValues,
    toUpdateFinalPhasePayload,
    toUpdateGroupPhasePayload,
    validateFinalPhaseForm,
    validateGroupPhaseForm
} from './phase-form';

const range = { startDate: '2026-03-01', endDate: '2026-03-31' };
const tournament = { id: 7, name: 'Copa' };
const group: GroupPhase = { id: 1, name: 'Fase de grupos', order: 1, groupName: 'A', qualifiersCount: 2, startDate: '2026-03-02', endDate: null, tournament, teamsCount: 0, matchesCount: 0 };
const final: FinalPhase = { id: 2, name: 'Final', order: 2, round: 'FINAL', startDate: null, endDate: null, tournament, matchesCount: 0 };

describe('phase-form', () => {
    it('valida los campos obligatorios y el rango de fechas del torneo', () => {
        const errors = validateGroupPhaseForm({ name: ' ', order: 0, groupName: '', qualifiersCount: 0, startDate: new Date(2026, 1, 20), endDate: null }, range);
        expect(errors.name).toBeDefined();
        expect(errors.order).toBeDefined();
        expect(errors.groupName).toBeDefined();
        expect(errors.qualifiersCount).toBeDefined();
        expect(errors.startDate).toContain('01/03/2026');
    });

    it('rechaza fin anterior al inicio y exige la ronda en la fase final', () => {
        const errors = validateFinalPhaseForm({ name: 'Final', order: 3, round: null, startDate: new Date(2026, 2, 10), endDate: new Date(2026, 2, 5) }, range);
        expect(errors.endDate).toBeDefined();
        expect(errors.round).toBeDefined();
    });

    it('construye el payload de creación del grupo en mayúsculas y sin opcionales vacíos', () => {
        const values = { name: ' Fase de grupos ', order: 1, groupName: ' a ', qualifiersCount: null, startDate: null, endDate: new Date(2026, 2, 9) };
        expect(toCreateGroupPhasePayload(values, 7)).toEqual({ tournamentId: 7, name: 'Fase de grupos', order: 1, groupName: 'A', endDate: '2026-03-09' });
        expect(toCreateFinalPhasePayload({ name: 'Final', order: 2, round: 'FINAL', startDate: null, endDate: null }, 7)).toEqual({ tournamentId: 7, name: 'Final', order: 2, round: 'FINAL' });
    });

    it('en la edición envía solo lo cambiado y null para borrar valores opcionales', () => {
        const values = toGroupPhaseFormValues(group);
        expect(toUpdateGroupPhasePayload(values, group)).toEqual({});
        expect(toUpdateGroupPhasePayload({ ...values, qualifiersCount: null, startDate: null, groupName: 'b' }, group)).toEqual({ groupName: 'B', qualifiersCount: null, startDate: null });

        const finalValues = toFinalPhaseFormValues(final);
        expect(toUpdateFinalPhasePayload(finalValues, final)).toEqual({});
        expect(toUpdateFinalPhasePayload({ ...finalValues, round: 'SEMI_FINAL' }, final)).toEqual({ round: 'SEMI_FINAL' });
    });
});
