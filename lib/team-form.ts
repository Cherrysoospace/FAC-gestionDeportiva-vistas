import { CreateTeamPayload, Team, TeamModality, UpdateTeamPayload } from '@/types/sports';

export interface TeamFormValues {
    name: string;
    city: string;
    modality: TeamModality | null;
    // Solo al editar
    active: boolean;
}

export type TeamFormErrors = Partial<Record<keyof TeamFormValues, string>>;

export const EMPTY_TEAM_FORM: TeamFormValues = { name: '', city: '', modality: null, active: true };

// Mismas reglas que CreateTeamDto en ms-sports. El nombre único por modalidad lo valida el backend (409).
export function validateTeamForm(values: TeamFormValues): TeamFormErrors {
    const errors: TeamFormErrors = {};
    const name = values.name.trim();
    const city = values.city.trim();

    if (!name) errors.name = 'El nombre es obligatorio';
    else if (name.length > 120) errors.name = 'El nombre no puede superar los 120 caracteres';

    if (!city) errors.city = 'La ciudad es obligatoria';
    else if (city.length > 80) errors.city = 'La ciudad no puede superar los 80 caracteres';

    if (values.modality === null) errors.modality = 'Selecciona una modalidad';

    return errors;
}

export function toTeamFormValues(team: Team | null): TeamFormValues {
    if (!team) return EMPTY_TEAM_FORM;
    return { name: team.name, city: team.city, modality: team.modality, active: team.active };
}

// Se llama después de validar: la modalidad ya tiene valor.
export function toCreateTeamPayload(values: TeamFormValues): CreateTeamPayload {
    return { name: values.name.trim(), city: values.city.trim(), modality: values.modality ?? 'MIXED' };
}

// Solo envía lo que cambió respecto al equipo guardado.
export function toUpdateTeamPayload(values: TeamFormValues, original: Team): UpdateTeamPayload {
    const next = toCreateTeamPayload(values);
    const payload: UpdateTeamPayload = {};

    if (next.name !== original.name) payload.name = next.name;
    if (next.city !== original.city) payload.city = next.city;
    if (next.modality !== original.modality) payload.modality = next.modality;
    if (values.active !== original.active) payload.active = values.active;

    return payload;
}
