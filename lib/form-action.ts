import { ApiRequestError } from './api';
import { describeError } from './api-errors';
import { ActionResult } from '@/types/action';

/** ActionResult que distingue los errores de validación por campo (400 del ValidationPipe). */
export interface FormActionResult extends ActionResult {
    validation?: boolean;
}

/**
 * Un 400 sin errorCase viene del ValidationPipe de ms-sports ({ campo: mensaje }):
 * apiFetch une esos mensajes en `message`. Los 400 de reglas de negocio traen
 * errorCase INVALID_OPERATION.
 */
export function isValidationError(cause: unknown): boolean {
    return cause instanceof ApiRequestError && cause.status === 400 && cause.errorCase === 'HTTP_ERROR';
}

/** Ejecuta una acción de la interfaz y la convierte en un resultado para el aviso o el formulario. */
export async function runFormAction(action: () => Promise<void>): Promise<FormActionResult> {
    try {
        await action();
        return { ok: true };
    } catch (cause) {
        return { ok: false, error: describeError(cause), validation: isValidationError(cause) };
    }
}
