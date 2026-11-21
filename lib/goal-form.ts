import { toIsoDate } from './dates';
import { CreateGoalPayload, Goal, Match, RecordMatchResultPayload, TeamPlayer, UpdateGoalPayload } from '@/types/sports';

export interface MatchResultFormErrors {
    homeScore?: string;
    awayScore?: string;
}

export function validateMatchResultForm(homeScore: number | null, awayScore: number | null): MatchResultFormErrors {
    const errors: MatchResultFormErrors = {};

    if (homeScore === null || !Number.isInteger(homeScore)) {
        errors.homeScore = 'El marcador local es obligatorio y debe ser entero';
    } else if (homeScore < 0) {
        errors.homeScore = 'El marcador local no puede ser negativo';
    }

    if (awayScore === null || !Number.isInteger(awayScore)) {
        errors.awayScore = 'El marcador visitante es obligatorio y debe ser entero';
    } else if (awayScore < 0) {
        errors.awayScore = 'El marcador visitante no puede ser negativo';
    }

    return errors;
}

export function toRecordMatchResultPayload(homeScore: number | null, awayScore: number | null): RecordMatchResultPayload {
    return {
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0
    };
}

export interface GoalFormValues {
    playerId: number | null;
    minute: number | null;
    points: number | null;
    description: string;
}

export type GoalFormErrors = Partial<Record<keyof GoalFormValues, string>>;

export const EMPTY_GOAL_FORM: GoalFormValues = {
    playerId: null,
    minute: null,
    points: 1,
    description: ''
};

export function toGoalFormValues(goal: Goal | null): GoalFormValues {
    if (!goal) return EMPTY_GOAL_FORM;
    return {
        playerId: goal.player.id,
        minute: goal.minute,
        points: goal.points,
        description: goal.description ?? ''
    };
}

export function validateGoalForm(values: GoalFormValues): GoalFormErrors {
    const errors: GoalFormErrors = {};

    if (values.playerId === null || values.playerId < 1) {
        errors.playerId = 'Selecciona el jugador que anotó';
    }

    if (values.minute === null || !Number.isInteger(values.minute)) {
        errors.minute = 'El minuto es obligatorio y debe ser entero';
    } else if (values.minute < 0 || values.minute > 300) {
        errors.minute = 'El minuto debe estar entre 0 y 300';
    }

    if (values.points === null || !Number.isInteger(values.points)) {
        errors.points = 'Los puntos son obligatorios y deben ser enteros';
    } else if (values.points < 1 || values.points > 10) {
        errors.points = 'Los puntos deben estar entre 1 y 10';
    }

    if (values.description.trim().length > 200) {
        errors.description = 'La descripción no puede superar los 200 caracteres';
    }

    return errors;
}

export function toCreateGoalPayload(matchId: number, values: GoalFormValues): CreateGoalPayload {
    const description = values.description.trim();
    return {
        matchId,
        playerId: values.playerId ?? 0,
        minute: values.minute ?? 0,
        points: values.points ?? 1,
        description: description || null
    };
}

export function toUpdateGoalPayload(values: GoalFormValues, original: Goal): UpdateGoalPayload {
    const payload: UpdateGoalPayload = {};
    const description = values.description.trim() || null;

    if (values.playerId !== null && values.playerId !== original.player.id) {
        payload.playerId = values.playerId;
    }
    if (values.minute !== null && values.minute !== original.minute) {
        payload.minute = values.minute;
    }
    if (values.points !== null && values.points !== original.points) {
        payload.points = values.points;
    }
    if (description !== original.description) {
        payload.description = description;
    }

    return payload;
}

export interface MatchPlayerOption {
    label: string;
    value: number;
    teamName: string;
}

/**
 * Misma regla que GoalRulesPolicy en ms-sports: jugador con contrato vigente
 * o activo en la fecha del partido en uno de los dos equipos participantes.
 */
export function filterMatchEligiblePlayers(
    contracts: readonly TeamPlayer[],
    match: Pick<Match, 'scheduledAt' | 'homeTeam' | 'awayTeam'>
): MatchPlayerOption[] {
    const matchDay = toIsoDate(new Date(match.scheduledAt)) ?? '';
    const teamIds = new Set([match.homeTeam.id, match.awayTeam.id]);
    const optionsByPlayer = new Map<number, MatchPlayerOption>();

    for (const contract of contracts) {
        if (!teamIds.has(contract.team.id)) continue;
        const effectiveEnd = contract.releaseDate ?? contract.endDate;
        const eligible = contract.stage === 'CURRENT' || (contract.startDate <= matchDay && effectiveEnd >= matchDay);
        if (!eligible || optionsByPlayer.has(contract.player.id)) continue;

        optionsByPlayer.set(contract.player.id, {
            label: `${contract.player.fullName} · ${contract.team.name} (${contract.player.position})`,
            value: contract.player.id,
            teamName: contract.team.name
        });
    }

    return Array.from(optionsByPlayer.values()).sort((a, b) => a.label.localeCompare(b.label));
}
