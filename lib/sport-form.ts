import { CreateSportPayload, Sport, UpdateSportPayload } from '@/types/sports';

export interface SportFormValues {
    name: string;
    description: string;
    // null = deporte raíz (sin padre)
    parentId: number | null;
    // Solo al editar
    active: boolean;
}

export type SportFormErrors = Partial<Record<keyof SportFormValues, string>>;

export const EMPTY_SPORT_FORM: SportFormValues = { name: '', description: '', parentId: null, active: true };

// Mismas reglas que CreateSportDto en ms-sports. El nombre único y los ciclos de padre los valida el backend.
export function validateSportForm(values: SportFormValues): SportFormErrors {
    const errors: SportFormErrors = {};
    const name = values.name.trim();

    if (!name) errors.name = 'El nombre es obligatorio';
    else if (name.length > 100) errors.name = 'El nombre no puede superar los 100 caracteres';

    if (values.description.trim().length > 255) errors.description = 'La descripción no puede superar los 255 caracteres';

    return errors;
}

export function toSportFormValues(sport: Sport | null): SportFormValues {
    if (!sport) return EMPTY_SPORT_FORM;
    return { name: sport.name, description: sport.description ?? '', parentId: sport.parent?.id ?? null, active: sport.active };
}

export function toCreateSportPayload(values: SportFormValues): CreateSportPayload {
    const description = values.description.trim();
    const payload: CreateSportPayload = { name: values.name.trim() };
    if (description) payload.description = description;
    if (values.parentId !== null) payload.parentId = values.parentId;
    return payload;
}

// Solo envía lo que cambió. description/parentId aceptan null para borrarse (ver UpdateSportDto).
export function toUpdateSportPayload(values: SportFormValues, original: Sport): UpdateSportPayload {
    const payload: UpdateSportPayload = {};
    const name = values.name.trim();
    const description = values.description.trim() || null;

    if (name !== original.name) payload.name = name;
    if (description !== (original.description ?? null)) payload.description = description;
    if (values.parentId !== (original.parent?.id ?? null)) payload.parentId = values.parentId;
    if (values.active !== original.active) payload.active = values.active;

    return payload;
}

