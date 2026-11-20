import { formatDay } from './tournament-labels';
import { parseIsoDate, toIsoDate } from './dates';
import { CreateTeamPlayerPayload, ReleaseReason, ReleaseTeamPlayerPayload, TeamPlayer, UpdateTeamPlayerPayload } from '@/types/sports';

// ---- Asignar o editar un contrato (HU-GD-05) ----

export interface ContractFormValues {
    // Solo al asignar; al editar el jugador no cambia
    playerId: number | null;
    startDate: Date | null;
    endDate: Date | null;
}

export type ContractFormErrors = Partial<Record<keyof ContractFormValues, string>>;

// Mismas reglas que ContractPeriodPolicy.assertValidPeriod. Los cruces de periodo los valida el backend (409).
export function validateContractForm(values: ContractFormValues, editing: boolean): ContractFormErrors {
    const errors: ContractFormErrors = {};

    if (!editing && values.playerId === null) errors.playerId = 'Selecciona un jugador';
    if (!values.startDate) errors.startDate = 'La fecha de inicio del contrato es obligatoria';
    if (!values.endDate) errors.endDate = 'La fecha de fin del contrato es obligatoria';

    const start = toIsoDate(values.startDate);
    const end = toIsoDate(values.endDate);
    if (start && end && start >= end) errors.endDate = 'La fecha de fin debe ser posterior a la de inicio';

    return errors;
}

export function toContractFormValues(contract: TeamPlayer | null): ContractFormValues {
    if (!contract) return { playerId: null, startDate: null, endDate: null };
    return { playerId: contract.player.id, startDate: parseIsoDate(contract.startDate), endDate: parseIsoDate(contract.endDate) };
}

export function toCreateContractPayload(values: ContractFormValues, teamId: number): CreateTeamPlayerPayload {
    return { teamId, playerId: values.playerId ?? 0, startDate: toIsoDate(values.startDate) ?? '', endDate: toIsoDate(values.endDate) ?? '' };
}

// Solo envía las fechas que cambiaron.
export function toUpdateContractPayload(values: ContractFormValues, original: TeamPlayer): UpdateTeamPlayerPayload {
    const payload: UpdateTeamPlayerPayload = {};
    const start = toIsoDate(values.startDate);
    const end = toIsoDate(values.endDate);
    if (start && start !== original.startDate) payload.startDate = start;
    if (end && end !== original.endDate) payload.endDate = end;
    return payload;
}

// ---- Retirar de la plantilla ----

export interface ReleaseFormValues {
    reason: ReleaseReason | null;
    // null = hoy (o el fin del contrato si ya venció), como en el backend
    releaseDate: Date | null;
}

export type ReleaseFormErrors = Partial<Record<keyof ReleaseFormValues, string>>;

// Misma regla que ContractPeriodPolicy.resolveReleaseDate: dentro del contrato y no futura.
export function validateReleaseForm(values: ReleaseFormValues, contract: TeamPlayer, today = new Date()): ReleaseFormErrors {
    const errors: ReleaseFormErrors = {};
    if (values.reason === null) errors.reason = 'Selecciona el motivo de salida';

    const date = toIsoDate(values.releaseDate);
    if (date) {
        if (date > (toIsoDate(today) ?? '')) errors.releaseDate = 'La fecha de retiro no puede ser futura';
        else if (date < contract.startDate || date > contract.endDate) errors.releaseDate = `Debe estar dentro del contrato (${formatDay(contract.startDate)} – ${formatDay(contract.endDate)})`;
    }
    return errors;
}

export function toReleasePayload(values: ReleaseFormValues): ReleaseTeamPlayerPayload {
    const releaseDate = toIsoDate(values.releaseDate);
    return { reason: values.reason ?? 'CONTRACT_ENDED', ...(releaseDate ? { releaseDate } : {}) };
}
