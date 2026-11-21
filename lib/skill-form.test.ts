import { describe, expect, it } from 'vitest';
import { Skill } from '@/types/sports';
import { toCreateSkillPayload, toSkillFormValues, toUpdateSkillPayload, validateSkillForm } from './skill-form';

const skill: Skill = { id: 1, name: 'Velocidad', category: 'PHYSICAL', description: 'Rapidez en carrera' };

describe('skill-form', () => {
    it('exige nombre, categoría y descripción', () => {
        const errors = validateSkillForm({ name: ' ', category: null, description: '' });
        expect(errors.name).toBeDefined();
        expect(errors.category).toBeDefined();
        expect(errors.description).toBeDefined();
        expect(validateSkillForm({ name: 'x'.repeat(81), category: 'MENTAL', description: 'x'.repeat(501) })).toEqual({
            name: expect.any(String),
            description: expect.any(String)
        });
    });

    it('construye el payload de creación recortando espacios', () => {
        expect(toCreateSkillPayload({ name: ' Pase ', category: 'TECHNICAL', description: ' Precisión ' })).toEqual({ name: 'Pase', category: 'TECHNICAL', description: 'Precisión' });
    });

    it('en la edición envía solo lo cambiado', () => {
        const values = toSkillFormValues(skill);
        expect(toUpdateSkillPayload(values, skill)).toEqual({});
        expect(toUpdateSkillPayload({ ...values, category: 'TACTICAL' }, skill)).toEqual({ category: 'TACTICAL' });
    });
});

