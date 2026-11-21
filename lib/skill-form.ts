import { CreateSkillPayload, Skill, SkillCategory, UpdateSkillPayload } from '@/types/sports';

export interface SkillFormValues {
    name: string;
    category: SkillCategory | null;
    description: string;
}

export type SkillFormErrors = Partial<Record<keyof SkillFormValues, string>>;

export const EMPTY_SKILL_FORM: SkillFormValues = { name: '', category: null, description: '' };

// Mismas reglas que CreateSkillDto en ms-sports (los tres campos son obligatorios).
export function validateSkillForm(values: SkillFormValues): SkillFormErrors {
    const errors: SkillFormErrors = {};
    const name = values.name.trim();
    const description = values.description.trim();

    if (!name) errors.name = 'El nombre es obligatorio';
    else if (name.length > 80) errors.name = 'El nombre no puede superar los 80 caracteres';

    if (values.category === null) errors.category = 'Selecciona una categoría';

    if (!description) errors.description = 'La descripción es obligatoria';
    else if (description.length > 500) errors.description = 'La descripción no puede superar los 500 caracteres';

    return errors;
}

export function toSkillFormValues(skill: Skill | null): SkillFormValues {
    if (!skill) return EMPTY_SKILL_FORM;
    return { name: skill.name, category: skill.category, description: skill.description };
}

// Se llama después de validar: la categoría ya tiene valor.
export function toCreateSkillPayload(values: SkillFormValues): CreateSkillPayload {
    return { name: values.name.trim(), category: values.category ?? 'PHYSICAL', description: values.description.trim() };
}

// Solo envía lo que cambió.
export function toUpdateSkillPayload(values: SkillFormValues, original: Skill): UpdateSkillPayload {
    const payload: UpdateSkillPayload = {};
    const next = toCreateSkillPayload(values);

    if (next.name !== original.name) payload.name = next.name;
    if (next.category !== original.category) payload.category = next.category;
    if (next.description !== original.description) payload.description = next.description;

    return payload;
}

