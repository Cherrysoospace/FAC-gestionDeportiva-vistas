import { Ball, CreateBallPayload, UpdateBallPayload } from '@/types/sports';

export interface BallFormValues {
    brand: string;
    model: string;
    size: string;
    // Solo al editar
    active: boolean;
}

export type BallFormErrors = Partial<Record<keyof BallFormValues, string>>;

export const EMPTY_BALL_FORM: BallFormValues = { brand: '', model: '', size: '', active: true };

// Mismas reglas que CreateBallDto en ms-sports.
export function validateBallForm(values: BallFormValues): BallFormErrors {
    const errors: BallFormErrors = {};
    const brand = values.brand.trim();
    const model = values.model.trim();

    if (!brand) errors.brand = 'La marca es obligatoria';
    else if (brand.length > 80) errors.brand = 'La marca no puede superar los 80 caracteres';

    if (!model) errors.model = 'El modelo es obligatorio';
    else if (model.length > 80) errors.model = 'El modelo no puede superar los 80 caracteres';

    if (values.size.trim().length > 20) errors.size = 'La talla no puede superar los 20 caracteres';

    return errors;
}

export function toBallFormValues(ball: Ball | null): BallFormValues {
    if (!ball) return EMPTY_BALL_FORM;
    return { brand: ball.brand, model: ball.model, size: ball.size ?? '', active: ball.active };
}

export function toCreateBallPayload(values: BallFormValues): CreateBallPayload {
    const size = values.size.trim();
    const payload: CreateBallPayload = { brand: values.brand.trim(), model: values.model.trim() };
    if (size) payload.size = size;
    return payload;
}

// Solo envía lo que cambió. size acepta null para borrar la talla (ver UpdateBallDto).
export function toUpdateBallPayload(values: BallFormValues, original: Ball): UpdateBallPayload {
    const payload: UpdateBallPayload = {};
    const brand = values.brand.trim();
    const model = values.model.trim();
    const size = values.size.trim() || null;

    if (brand !== original.brand) payload.brand = brand;
    if (model !== original.model) payload.model = model;
    if (size !== (original.size ?? null)) payload.size = size;
    if (values.active !== original.active) payload.active = values.active;

    return payload;
}
