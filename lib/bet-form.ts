import {
    Bet,
    BetSelection,
    BetStatus,
    CancelBetPayload,
    CreateBetPayload,
    PlaceBetPayload,
    UpdateMyBetPayload
} from '@/types/sports';
import { TagSeverity } from './tournament-labels';

export const BET_SELECTION_LABELS: Record<BetSelection, string> = {
    HOME_WIN: 'Victoria local',
    DRAW: 'Empate',
    AWAY_WIN: 'Victoria visitante'
};

export const BET_SELECTION_OPTIONS = (Object.keys(BET_SELECTION_LABELS) as BetSelection[]).map((selection) => ({
    label: BET_SELECTION_LABELS[selection],
    value: selection
}));

export const BET_STATUS_LABELS: Record<BetStatus, string> = {
    PENDING: 'Pendiente',
    WON: 'Ganada',
    LOST: 'Perdida',
    VOID: 'Anulada',
    CANCELLED: 'Cancelada'
};

export const BET_STATUS_SEVERITY: Record<BetStatus, Exclude<TagSeverity, null>> = {
    PENDING: 'warning',
    WON: 'success',
    LOST: 'danger',
    VOID: 'info',
    CANCELLED: 'info'
};

export const BET_STATUS_OPTIONS = (Object.keys(BET_STATUS_LABELS) as BetStatus[]).map((status) => ({
    label: BET_STATUS_LABELS[status],
    value: status
}));

export interface BetFormValues {
    fanId: number | null;
    matchId: number | null;
    fanPaymentMethodId: number | null;
    selection: BetSelection | null;
    amount: number | null;
    odds: number | null;
}

export type BetFormErrors = Partial<Record<keyof BetFormValues, string>>;

export function createEmptyBetForm(matchId: number | null = null, fanPaymentMethodId: number | null = null): BetFormValues {
    return {
        fanId: null,
        matchId,
        fanPaymentMethodId,
        selection: 'HOME_WIN',
        amount: null,
        odds: 1.8
    };
}

export function toBetFormValues(bet: Bet): BetFormValues {
    return {
        fanId: bet.fan.id,
        matchId: bet.match.id,
        fanPaymentMethodId: bet.paymentMethod.id,
        selection: bet.selection,
        amount: bet.amount,
        odds: bet.odds
    };
}

export function roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
}

export function calculatePotentialPayout(amount: number | null, odds: number | null): number {
    if (amount === null || odds === null || !Number.isFinite(amount) || !Number.isFinite(odds)) {
        return 0;
    }
    if (amount <= 0 || odds <= 0) return 0;
    return roundCurrency(amount * odds);
}

// Mismas reglas que BetRulesPolicy en ms-sports
export function canModifyOrCancelMyBet(bet: Bet): boolean {
    return bet.status === 'PENDING' && bet.match.status === 'SCHEDULED' && bet.match.bettingOpen;
}

export function canVoidBetByAdmin(bet: Bet): boolean {
    return bet.status === 'PENDING';
}

export function shouldUseMyBetsSummary(canViewMine: boolean, canViewAdmin: boolean, profileMissing: boolean): boolean {
    return canViewMine && !(canViewAdmin && profileMissing);
}

export function validateBetForm(values: BetFormValues, options: { editing: boolean; requireFan: boolean }): BetFormErrors {
    const errors: BetFormErrors = {};

    if (!options.editing && options.requireFan && (values.fanId === null || !Number.isInteger(values.fanId) || values.fanId < 1)) {
        errors.fanId = 'Debes seleccionar un aficionado activo';
    }

    if (!options.editing && (values.matchId === null || !Number.isInteger(values.matchId) || values.matchId < 1)) {
        errors.matchId = 'Debes seleccionar un partido con apuestas abiertas';
    }

    if (values.fanPaymentMethodId === null || !Number.isInteger(values.fanPaymentMethodId) || values.fanPaymentMethodId < 1) {
        errors.fanPaymentMethodId = 'Debes indicar un método de pago válido';
    }

    if (!values.selection) {
        errors.selection = 'Debes seleccionar un pronóstico';
    }

    if (values.amount === null || !Number.isFinite(values.amount)) {
        errors.amount = 'El valor de la apuesta es obligatorio';
    } else if (values.amount < 1) {
        errors.amount = 'El valor de la apuesta debe ser al menos 1';
    } else if (values.amount > 100000000) {
        errors.amount = 'El valor de la apuesta supera el máximo permitido';
    }

    if (!options.editing) {
        if (values.odds === null || !Number.isFinite(values.odds)) {
            errors.odds = 'La cuota fija es obligatoria';
        } else if (values.odds < 1.01) {
            errors.odds = 'La cuota debe ser mayor a 1.00 (mínimo 1.01)';
        } else if (values.odds > 100) {
            errors.odds = 'La cuota no puede superar 100.00';
        }
    }

    return errors;
}

export function validateCancelBetReason(reason: string): string | null {
    if (reason.trim().length > 255) {
        return 'El motivo no puede superar 255 caracteres';
    }
    return null;
}

export function toCancelBetPayload(reason: string): CancelBetPayload {
    const trimmed = reason.trim();
    return trimmed ? { reason: trimmed } : {};
}

export function toPlaceBetPayload(values: BetFormValues): PlaceBetPayload {
    return {
        matchId: values.matchId ?? 0,
        fanPaymentMethodId: values.fanPaymentMethodId ?? 0,
        selection: (values.selection ?? 'HOME_WIN') as BetSelection,
        amount: roundCurrency(values.amount ?? 0),
        odds: roundCurrency(values.odds ?? 1.01)
    };
}

export function toCreateBetPayload(values: BetFormValues): CreateBetPayload {
    return {
        fanId: values.fanId ?? 0,
        matchId: values.matchId ?? 0,
        fanPaymentMethodId: values.fanPaymentMethodId ?? 0,
        selection: (values.selection ?? 'HOME_WIN') as BetSelection,
        amount: roundCurrency(values.amount ?? 0),
        odds: roundCurrency(values.odds ?? 1.01)
    };
}

// HU-GC-11: al editar nunca se envía `odds` porque la cuota pactada es inmutable
export function toUpdateMyBetPayload(values: BetFormValues, original: Bet): UpdateMyBetPayload {
    const payload: UpdateMyBetPayload = {};

    if (values.fanPaymentMethodId !== null && values.fanPaymentMethodId !== original.paymentMethod.id) {
        payload.fanPaymentMethodId = values.fanPaymentMethodId;
    }
    if (values.selection !== null && values.selection !== original.selection) {
        payload.selection = values.selection;
    }
    if (values.amount !== null && roundCurrency(values.amount) !== roundCurrency(original.amount)) {
        payload.amount = roundCurrency(values.amount);
    }

    return payload;
}

