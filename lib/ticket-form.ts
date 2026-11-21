import {
    CreateTicketPayload,
    LocationAvailability,
    MatchStatus,
    MatchTicketAvailability,
    PurchaseTicketPayload
} from '@/types/sports';
import { TagSeverity } from './tournament-labels';

export interface TicketFormValues {
    fanId: number | null;
    matchId: number | null;
    locationId: number | null;
    price: number | null;
}

export type TicketFormErrors = Partial<Record<keyof TicketFormValues, string>>;

export function createEmptyTicketForm(matchId: number | null = null, locationId: number | null = null): TicketFormValues {
    return {
        fanId: null,
        matchId,
        locationId,
        price: null
    };
}

export function canPurchaseTicketForMatch(status: MatchStatus): boolean {
    return status === 'SCHEDULED';
}

export function canCancelTicket(status: MatchStatus): boolean {
    return status === 'SCHEDULED';
}

export function occupancyPercentage(sold: number, capacity: number): number {
    if (capacity <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((sold / capacity) * 100)));
}

export function availabilityTag(location: LocationAvailability): { label: string; severity: Exclude<TagSeverity, null> } {
    if (!location.active) {
        return { label: 'Inactiva', severity: 'info' };
    }
    if (location.soldOut || location.available <= 0) {
        return { label: 'Agotada', severity: 'danger' };
    }
    if (occupancyPercentage(location.sold, location.capacity) >= 80 || location.available <= 5) {
        return { label: 'Últimos cupos', severity: 'warning' };
    }
    return { label: 'Disponible', severity: 'success' };
}

export function formatCurrencyCop(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
    }).format(amount);
}

export function validateTicketForm(
    values: TicketFormValues,
    requireFan: boolean,
    availability?: MatchTicketAvailability | null
): TicketFormErrors {
    const errors: TicketFormErrors = {};

    if (requireFan && (values.fanId === null || !Number.isInteger(values.fanId) || values.fanId < 1)) {
        errors.fanId = 'Debes seleccionar un aficionado activo';
    }

    if (values.matchId === null || !Number.isInteger(values.matchId) || values.matchId < 1) {
        errors.matchId = 'Debes seleccionar un partido programado';
    }

    if (values.locationId === null || !Number.isInteger(values.locationId) || values.locationId < 1) {
        errors.locationId = 'Debes seleccionar una localidad del escenario';
    } else if (availability && availability.matchId === values.matchId) {
        const selectedLocation = availability.locations.find((item) => item.locationId === values.locationId);
        if (!selectedLocation) {
            errors.locationId = 'La localidad seleccionada no pertenece al escenario del partido';
        } else if (!selectedLocation.active) {
            errors.locationId = `La localidad ${selectedLocation.locationName} está inactiva`;
        } else if (selectedLocation.soldOut || selectedLocation.available <= 0) {
            errors.locationId = `La localidad ${selectedLocation.locationName} no tiene cupos disponibles`;
        }
    }

    if (values.price !== null) {
        if (!Number.isFinite(values.price) || values.price < 0) {
            errors.price = 'El precio del boleto no puede ser negativo';
        } else if (values.price > 99999999.99) {
            errors.price = 'El precio del boleto supera el máximo permitido';
        }
    }

    return errors;
}

export function toPurchaseTicketPayload(values: TicketFormValues): PurchaseTicketPayload {
    const payload: PurchaseTicketPayload = {
        matchId: values.matchId ?? 0,
        locationId: values.locationId ?? 0
    };
    if (values.price !== null && Number.isFinite(values.price)) {
        payload.price = Math.round(values.price * 100) / 100;
    }
    return payload;
}

export function toCreateTicketPayload(values: TicketFormValues): CreateTicketPayload {
    const payload: CreateTicketPayload = {
        fanId: values.fanId ?? 0,
        matchId: values.matchId ?? 0,
        locationId: values.locationId ?? 0
    };
    if (values.price !== null && Number.isFinite(values.price)) {
        payload.price = Math.round(values.price * 100) / 100;
    }
    return payload;
}

