import { CreateVenuePayload, UpdateVenuePayload, Venue } from '@/types/sports';

export interface VenueFormValues {
    name: string;
    address: string;
    // null = escenario principal
    parentId: number | null;
    // Solo al editar
    active: boolean;
}

export type VenueFormErrors = Partial<Record<keyof VenueFormValues, string>>;

export const EMPTY_VENUE_FORM: VenueFormValues = { name: '', address: '', parentId: null, active: true };

// Mismas reglas que CreateVenueDto. Los ciclos y nombres repetidos los valida el backend.
export function validateVenueForm(values: VenueFormValues): VenueFormErrors {
    const errors: VenueFormErrors = {};
    const name = values.name.trim();

    if (!name) errors.name = 'El nombre es obligatorio';
    else if (name.length > 120) errors.name = 'El nombre no puede superar los 120 caracteres';

    if (values.address.trim().length > 200) errors.address = 'La dirección no puede superar los 200 caracteres';

    return errors;
}

/** `parentId` permite abrir el formulario de un espacio interno con el padre ya elegido. */
export function toVenueFormValues(venue: Venue | null, parentId: number | null = null): VenueFormValues {
    if (!venue) return { ...EMPTY_VENUE_FORM, parentId };
    return { name: venue.name, address: venue.address ?? '', parentId: venue.parent?.id ?? null, active: venue.active };
}

// Dirección vacía = sin dirección (null)
export function toCreateVenuePayload(values: VenueFormValues): CreateVenuePayload {
    return { name: values.name.trim(), address: values.address.trim() || null, parentId: values.parentId };
}

// Solo envía lo que cambió. parentId null = pasa a ser escenario principal.
export function toUpdateVenuePayload(values: VenueFormValues, original: Venue): UpdateVenuePayload {
    const next = toCreateVenuePayload(values);
    const payload: UpdateVenuePayload = {};

    if (next.name !== original.name) payload.name = next.name;
    if (next.address !== original.address) payload.address = next.address;
    if (next.parentId !== (original.parent?.id ?? null)) payload.parentId = next.parentId;
    if (values.active !== original.active) payload.active = values.active;

    return payload;
}
