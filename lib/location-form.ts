import { CreateLocationPayload, Location, UpdateLocationPayload } from '@/types/sports';

// Mismo límite que MAX_LOCATION_CAPACITY en ms-sports
export const MAX_LOCATION_CAPACITY = 200000;

export interface LocationFormValues {
    name: string;
    capacity: number | null;
    // Solo al editar
    active: boolean;
}

export type LocationFormErrors = Partial<Record<keyof LocationFormValues, string>>;

export const EMPTY_LOCATION_FORM: LocationFormValues = { name: '', capacity: null, active: true };

// Mismas reglas que CreateLocationDto. El nombre repetido en el escenario lo valida el backend (409).
export function validateLocationForm(values: LocationFormValues): LocationFormErrors {
    const errors: LocationFormErrors = {};
    const name = values.name.trim();

    if (!name) errors.name = 'El nombre es obligatorio';
    else if (name.length > 60) errors.name = 'El nombre no puede superar los 60 caracteres';

    if (values.capacity === null) errors.capacity = 'La capacidad es obligatoria';
    else if (!Number.isInteger(values.capacity) || values.capacity < 1) errors.capacity = 'La capacidad debe ser un número entero de al menos 1';
    else if (values.capacity > MAX_LOCATION_CAPACITY) errors.capacity = `La capacidad no puede superar ${MAX_LOCATION_CAPACITY.toLocaleString('es-CO')}`;

    return errors;
}

export function toLocationFormValues(location: Location | null): LocationFormValues {
    if (!location) return EMPTY_LOCATION_FORM;
    return { name: location.name, capacity: location.capacity, active: location.active };
}

// Se llama después de validar: la capacidad ya tiene valor.
export function toCreateLocationPayload(values: LocationFormValues, venueId: number): CreateLocationPayload {
    return { venueId, name: values.name.trim(), capacity: values.capacity ?? 1 };
}

// Solo envía lo que cambió (el escenario no se puede cambiar).
export function toUpdateLocationPayload(values: LocationFormValues, original: Location): UpdateLocationPayload {
    const payload: UpdateLocationPayload = {};
    const name = values.name.trim();

    if (name !== original.name) payload.name = name;
    if (values.capacity !== null && values.capacity !== original.capacity) payload.capacity = values.capacity;
    if (values.active !== original.active) payload.active = values.active;

    return payload;
}
