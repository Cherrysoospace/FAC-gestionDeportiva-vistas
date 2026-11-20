import { parseIsoDate, toIsoDate } from './dates';
import { normalizeDocument } from './player-labels';
import { CreatePlayerPayload, DominantFoot, Player, UpdatePlayerPayload } from '@/types/sports';

// Mismos límites que CreatePlayerDto y PlayerAgePolicy en ms-sports
export const DOCUMENT_REGEX = /^[A-Z0-9-]{5,20}$/;
export const MIN_AGE = 5;
export const MAX_AGE = 80;
export const MIN_HEIGHT_CM = 100;
export const MAX_HEIGHT_CM = 250;

export interface PlayerFormValues {
    fullName: string;
    documentNumber: string;
    birthDate: Date | null;
    nationality: string;
    position: string;
    heightCm: number | null;
    // null = no aplica
    dominantFoot: DominantFoot | null;
    // Solo al editar
    active: boolean;
}

export type PlayerFormErrors = Partial<Record<keyof PlayerFormValues, string>>;

export const EMPTY_PLAYER_FORM: PlayerFormValues = {
    fullName: '',
    documentNumber: '',
    birthDate: null,
    nationality: '',
    position: '',
    heightCm: null,
    dominantFoot: null,
    active: true
};

// Años cumplidos a la fecha `today` (igual que PlayerAgePolicy.ageOn)
export function ageOn(birthDate: Date, today = new Date()): number {
    const hadBirthday = today.getMonth() > birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
    return today.getFullYear() - birthDate.getFullYear() - (hadBirthday ? 0 : 1);
}

function requiredText(value: string, max: number, empty: string, tooLong: string): string | undefined {
    const text = value.trim();
    if (!text) return empty;
    if (text.length > max) return tooLong;
    return undefined;
}

// El documento repetido lo valida el backend (409).
export function validatePlayerForm(values: PlayerFormValues, today = new Date()): PlayerFormErrors {
    const errors: PlayerFormErrors = {
        fullName: requiredText(values.fullName, 120, 'El nombre completo es obligatorio', 'El nombre no puede superar los 120 caracteres'),
        nationality: requiredText(values.nationality, 60, 'La nacionalidad es obligatoria', 'La nacionalidad no puede superar los 60 caracteres'),
        position: requiredText(values.position, 40, 'La posición es obligatoria', 'La posición no puede superar los 40 caracteres')
    };

    const document = normalizeDocument(values.documentNumber);
    if (!document) errors.documentNumber = 'El documento es obligatorio';
    else if (!DOCUMENT_REGEX.test(document)) errors.documentNumber = 'Solo letras, números y guiones (entre 5 y 20 caracteres)';

    if (!values.birthDate) errors.birthDate = 'La fecha de nacimiento es obligatoria';
    else if ((toIsoDate(values.birthDate) ?? '') > (toIsoDate(today) ?? '')) errors.birthDate = 'La fecha de nacimiento no puede ser futura';
    else {
        const age = ageOn(values.birthDate, today);
        if (age < MIN_AGE || age > MAX_AGE) errors.birthDate = `La edad debe estar entre ${MIN_AGE} y ${MAX_AGE} años (tendría ${age})`;
    }

    if (values.heightCm === null) errors.heightCm = 'La altura es obligatoria';
    else if (!Number.isInteger(values.heightCm) || values.heightCm < MIN_HEIGHT_CM || values.heightCm > MAX_HEIGHT_CM) errors.heightCm = `La altura debe estar entre ${MIN_HEIGHT_CM} y ${MAX_HEIGHT_CM} cm`;

    // Solo los campos con error
    return Object.fromEntries(Object.entries(errors).filter(([, message]) => message !== undefined)) as PlayerFormErrors;
}

export function toPlayerFormValues(player: Player | null): PlayerFormValues {
    if (!player) return EMPTY_PLAYER_FORM;
    return {
        fullName: player.fullName,
        documentNumber: player.documentNumber,
        birthDate: parseIsoDate(player.birthDate),
        nationality: player.nationality,
        position: player.position,
        heightCm: player.heightCm,
        dominantFoot: player.dominantFoot,
        active: player.active
    };
}

// Se llama después de validar: los campos obligatorios ya tienen valor.
export function toCreatePlayerPayload(values: PlayerFormValues): CreatePlayerPayload {
    return {
        fullName: values.fullName.trim(),
        documentNumber: normalizeDocument(values.documentNumber),
        birthDate: toIsoDate(values.birthDate) ?? '',
        nationality: values.nationality.trim(),
        position: values.position.trim(),
        heightCm: values.heightCm ?? MIN_HEIGHT_CM,
        dominantFoot: values.dominantFoot
    };
}

// Solo envía lo que cambió respecto al jugador guardado.
export function toUpdatePlayerPayload(values: PlayerFormValues, original: Player): UpdatePlayerPayload {
    const next = toCreatePlayerPayload(values);
    const payload: UpdatePlayerPayload = {};

    if (next.fullName !== original.fullName) payload.fullName = next.fullName;
    if (next.documentNumber !== original.documentNumber) payload.documentNumber = next.documentNumber;
    if (next.birthDate !== original.birthDate) payload.birthDate = next.birthDate;
    if (next.nationality !== original.nationality) payload.nationality = next.nationality;
    if (next.position !== original.position) payload.position = next.position;
    if (next.heightCm !== original.heightCm) payload.heightCm = next.heightCm;
    if ((next.dominantFoot ?? null) !== original.dominantFoot) payload.dominantFoot = next.dominantFoot ?? null;
    if (values.active !== original.active) payload.active = values.active;

    return payload;
}
