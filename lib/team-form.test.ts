import { describe, expect, it } from 'vitest';
import { toCreateTeamPayload, toTeamFormValues, toUpdateTeamPayload, validateTeamForm } from './team-form';
import { Team } from '@/types/sports';

const TEAM: Team = {
    id: 3,
    name: 'Atlético Manizales',
    city: 'Manizales',
    modality: 'MALE',
    active: true,
    sports: [],
    group: null,
    activeRegistrationsCount: 0,
    playersCount: 0
};

describe('validateTeamForm', () => {
    it('exige nombre, ciudad y modalidad', () => {
        expect(validateTeamForm({ name: ' ', city: '', modality: null, active: true })).toEqual({
            name: 'El nombre es obligatorio',
            city: 'La ciudad es obligatoria',
            modality: 'Selecciona una modalidad'
        });
    });

    it('limita la longitud como el backend', () => {
        const errors = validateTeamForm({ name: 'x'.repeat(121), city: 'y'.repeat(81), modality: 'MIXED', active: true });
        expect(errors.name).toContain('120');
        expect(errors.city).toContain('80');
    });

    it('acepta un equipo válido', () => {
        expect(validateTeamForm(toTeamFormValues(TEAM))).toEqual({});
    });
});

describe('payloads de equipo', () => {
    it('recorta los espacios al crear', () => {
        expect(toCreateTeamPayload({ name: '  Titanes FC ', city: ' Pereira ', modality: 'MIXED', active: true })).toEqual({ name: 'Titanes FC', city: 'Pereira', modality: 'MIXED' });
    });

    it('al editar solo envía lo que cambió', () => {
        expect(toUpdateTeamPayload(toTeamFormValues(TEAM), TEAM)).toEqual({});
        expect(toUpdateTeamPayload({ ...toTeamFormValues(TEAM), city: 'Pereira', active: false }, TEAM)).toEqual({ city: 'Pereira', active: false });
    });
});
