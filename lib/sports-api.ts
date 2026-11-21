import { apiFetch, ApiFetchOptions } from './api';
import { MessageResponse } from '@/types/sports';

// Base del microservicio ms-sports (NestJS), sin '/' final.
export const SPORTS_API_URL = (process.env.NEXT_PUBLIC_SPORTS_API_URL ?? 'http://localhost:3001/gestion-deportiva').replace(/\/$/, '');

// Prefijo con el que se registran en ms_security los permisos de ms-sports.
export const SPORTS_PERMISSION_PREFIX = '/gestion-deportiva';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Llamada a ms-sports. Delega en apiFetch: el Bearer, el cierre de sesión en
 * 401, el evento 'fac:forbidden' en 403 y el parseo de errores son los mismos
 * que con ms_security.
 */
export function sportsApiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    return apiFetch<T>(path, { ...options, baseUrl: SPORTS_API_URL });
}

/**
 * Arma el query string de los filtros. Omite undefined, null y '' (filtro sin
 * valor); conserva false y 0. Devuelve '' si no queda ningún parámetro.
 */
export function toQueryString(params: QueryParams): string {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }
        search.append(key, String(value));
    });

    const query = search.toString();
    return query ? `?${query}` : '';
}

export interface ResourceClient<TItem, TCreateDto = never, TUpdateDto = never, TQuery extends object = QueryParams> {
    list: (query?: TQuery, signal?: AbortSignal) => Promise<TItem[]>;
    getById: (id: number, signal?: AbortSignal) => Promise<TItem>;
    create: (payload: TCreateDto) => Promise<TItem>;
    update: (id: number, payload: TUpdateDto) => Promise<TItem>;
    remove: (id: number) => Promise<MessageResponse>;
}

/**
 * Factoría genérica para clientes CRUD REST de ms-sports.
 * Los endpoints específicos (/me/..., /availability, /result) se mantienen como funciones explícitas.
 */
export function createResourceClient<TItem, TCreateDto = never, TUpdateDto = never, TQuery extends object = QueryParams>(
    basePath: string
): ResourceClient<TItem, TCreateDto, TUpdateDto, TQuery> {
    const normalizedBase = (basePath.startsWith('/') ? basePath : `/${basePath}`).replace(/\/$/, '');

    return {
        list: (query?: TQuery, signal?: AbortSignal) =>
            sportsApiFetch<TItem[]>(`${normalizedBase}${query ? toQueryString(query as QueryParams) : ''}`, { signal }),
        getById: (id: number, signal?: AbortSignal) => sportsApiFetch<TItem>(`${normalizedBase}/${id}`, { signal }),
        create: (payload: TCreateDto) =>
            sportsApiFetch<TItem>(normalizedBase, {
                method: 'POST',
                body: JSON.stringify(payload)
            }),
        update: (id: number, payload: TUpdateDto) =>
            sportsApiFetch<TItem>(`${normalizedBase}/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            }),
        remove: (id: number) => sportsApiFetch<MessageResponse>(`${normalizedBase}/${id}`, { method: 'DELETE' })
    };
}
