import { parseIsoDate, toIsoDate } from './dates';
import { formatDay } from './tournament-labels';
import { CreateFinalPhasePayload, CreateGroupPhasePayload, FinalPhase, FinalRound, GroupPhase, UpdateFinalPhasePayload, UpdateGroupPhasePayload } from '@/types/sports';

/** Fechas del torneo (YYYY-MM-DD): las fechas de una fase deben quedar dentro. */
export interface PhaseDateRange {
    startDate: string;
    endDate: string;
}

export interface PhaseBaseValues {
    name: string;
    order: number | null;
    // Fechas de día (Calendar sin hora)
    startDate: Date | null;
    endDate: Date | null;
}

export type PhaseBaseErrors = Partial<Record<keyof PhaseBaseValues, string>>;

export interface GroupPhaseFormValues extends PhaseBaseValues {
    groupName: string;
    qualifiersCount: number | null;
}

export type GroupPhaseFormErrors = Partial<Record<keyof GroupPhaseFormValues, string>>;

export interface FinalPhaseFormValues extends PhaseBaseValues {
    round: FinalRound | null;
}

export type FinalPhaseFormErrors = Partial<Record<keyof FinalPhaseFormValues, string>>;

export const EMPTY_GROUP_PHASE_FORM: GroupPhaseFormValues = { name: '', order: null, groupName: '', qualifiersCount: null, startDate: null, endDate: null };

export const EMPTY_FINAL_PHASE_FORM: FinalPhaseFormValues = { name: '', order: null, round: null, startDate: null, endDate: null };

// Mismas reglas que CreateGroupPhaseDto / CreateFinalPhaseDto y PhaseRulesService en ms-sports.
// El orden compartido con otro tipo de fase y las reglas del estado del torneo las valida el backend.
export function validatePhaseBase(values: PhaseBaseValues, range: PhaseDateRange): PhaseBaseErrors {
    const errors: PhaseBaseErrors = {};
    const name = values.name.trim();

    if (!name) errors.name = 'El nombre es obligatorio';
    else if (name.length > 100) errors.name = 'El nombre no puede superar los 100 caracteres';

    if (values.order === null) errors.order = 'El orden es obligatorio';
    else if (!Number.isInteger(values.order) || values.order < 1) errors.order = 'El orden debe ser un entero mayor o igual a 1';

    const start = toIsoDate(values.startDate);
    const end = toIsoDate(values.endDate);
    const rangeText = `${formatDay(range.startDate)} a ${formatDay(range.endDate)}`;

    if (start && end && start > end) {
        errors.endDate = 'La fecha de fin debe ser igual o posterior a la de inicio';
    }
    if (start && (start < range.startDate || start > range.endDate)) {
        errors.startDate = `Debe estar dentro de las fechas del torneo (${rangeText})`;
    }
    if (!errors.endDate && end && (end < range.startDate || end > range.endDate)) {
        errors.endDate = `Debe estar dentro de las fechas del torneo (${rangeText})`;
    }

    return errors;
}

export function validateGroupPhaseForm(values: GroupPhaseFormValues, range: PhaseDateRange): GroupPhaseFormErrors {
    const errors: GroupPhaseFormErrors = validatePhaseBase(values, range);
    const groupName = values.groupName.trim();

    if (!groupName) errors.groupName = 'El nombre del grupo es obligatorio';
    else if (groupName.length > 10) errors.groupName = 'El nombre del grupo no puede superar los 10 caracteres';

    if (values.qualifiersCount !== null && (!Number.isInteger(values.qualifiersCount) || values.qualifiersCount < 1)) {
        errors.qualifiersCount = 'Debe clasificar al menos 1 equipo';
    }

    return errors;
}

export function validateFinalPhaseForm(values: FinalPhaseFormValues, range: PhaseDateRange): FinalPhaseFormErrors {
    const errors: FinalPhaseFormErrors = validatePhaseBase(values, range);
    if (values.round === null) errors.round = 'Selecciona la ronda';
    return errors;
}

export function toGroupPhaseFormValues(phase: GroupPhase | null): GroupPhaseFormValues {
    if (!phase) return EMPTY_GROUP_PHASE_FORM;
    return {
        name: phase.name,
        order: phase.order,
        groupName: phase.groupName,
        qualifiersCount: phase.qualifiersCount,
        startDate: parseIsoDate(phase.startDate),
        endDate: parseIsoDate(phase.endDate)
    };
}

export function toFinalPhaseFormValues(phase: FinalPhase | null): FinalPhaseFormValues {
    if (!phase) return EMPTY_FINAL_PHASE_FORM;
    return { name: phase.name, order: phase.order, round: phase.round, startDate: parseIsoDate(phase.startDate), endDate: parseIsoDate(phase.endDate) };
}

// Los campos opcionales vacíos no se envían al crear.
function optionalDates(values: PhaseBaseValues): { startDate?: string; endDate?: string } {
    const dates: { startDate?: string; endDate?: string } = {};
    const start = toIsoDate(values.startDate);
    const end = toIsoDate(values.endDate);
    if (start) dates.startDate = start;
    if (end) dates.endDate = end;
    return dates;
}

// Se llama después de validar: los campos obligatorios ya tienen valor.
export function toCreateGroupPhasePayload(values: GroupPhaseFormValues, tournamentId: number): CreateGroupPhasePayload {
    const payload: CreateGroupPhasePayload = {
        tournamentId,
        name: values.name.trim(),
        order: values.order ?? 1,
        groupName: values.groupName.trim().toUpperCase(),
        ...optionalDates(values)
    };
    if (values.qualifiersCount !== null) payload.qualifiersCount = values.qualifiersCount;
    return payload;
}

// Solo envía lo que cambió. qualifiersCount y las fechas aceptan null para borrarse (ver UpdateGroupPhaseDto).
export function toUpdateGroupPhasePayload(values: GroupPhaseFormValues, original: GroupPhase): UpdateGroupPhasePayload {
    const payload: UpdateGroupPhasePayload = {};
    const name = values.name.trim();
    const groupName = values.groupName.trim().toUpperCase();
    const startDate = toIsoDate(values.startDate);
    const endDate = toIsoDate(values.endDate);

    if (name !== original.name) payload.name = name;
    if (values.order !== null && values.order !== original.order) payload.order = values.order;
    if (groupName !== original.groupName) payload.groupName = groupName;
    if (values.qualifiersCount !== original.qualifiersCount) payload.qualifiersCount = values.qualifiersCount;
    if (startDate !== original.startDate) payload.startDate = startDate;
    if (endDate !== original.endDate) payload.endDate = endDate;

    return payload;
}

export function toCreateFinalPhasePayload(values: FinalPhaseFormValues, tournamentId: number): CreateFinalPhasePayload {
    return {
        tournamentId,
        name: values.name.trim(),
        order: values.order ?? 1,
        round: values.round ?? 'FINAL',
        ...optionalDates(values)
    };
}

// Solo envía lo que cambió. Las fechas aceptan null para borrarse (ver UpdateFinalPhaseDto).
export function toUpdateFinalPhasePayload(values: FinalPhaseFormValues, original: FinalPhase): UpdateFinalPhasePayload {
    const payload: UpdateFinalPhasePayload = {};
    const name = values.name.trim();
    const startDate = toIsoDate(values.startDate);
    const endDate = toIsoDate(values.endDate);

    if (name !== original.name) payload.name = name;
    if (values.order !== null && values.order !== original.order) payload.order = values.order;
    if (values.round !== null && values.round !== original.round) payload.round = values.round;
    if (startDate !== original.startDate) payload.startDate = startDate;
    if (endDate !== original.endDate) payload.endDate = endDate;

    return payload;
}

