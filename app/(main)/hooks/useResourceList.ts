'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { runFormAction } from '@/lib/form-action';
import { ResourceClient } from '@/lib/sports-api';

/**
 * Listado + CRUD genérico sobre un ResourceClient de ms-sports. Evita repetir el mismo
 * hook (carga, error, recarga, crear, editar, eliminar) en cada catálogo.
 * `query` debe ser estable (useMemo) o primitivo serializable: se compara por JSON.
 */
export function useResourceList<TItem extends { id: number }, TCreate, TUpdate, TQuery extends object>(client: ResourceClient<TItem, TCreate, TUpdate, TQuery>, query?: TQuery) {
    const [items, setItems] = useState<TItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const queryKey = JSON.stringify(query ?? {});

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        client
            .list(query, controller.signal)
            .then(setItems)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client, queryKey, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    // Al crear o editar se recarga: el cambio puede alterar el orden o los filtros (y datos relacionados)
    const create = useCallback(
        (payload: TCreate) =>
            runFormAction(async () => {
                await client.create(payload);
                reload();
            }),
        [client, reload]
    );

    const update = useCallback(
        (id: number, payload: TUpdate) =>
            runFormAction(async () => {
                await client.update(id, payload);
                reload();
            }),
        [client, reload]
    );

    const remove = useCallback(
        (id: number) =>
            runFormAction(async () => {
                await client.remove(id);
                setItems((current) => current.filter((item) => item.id !== id));
            }),
        [client]
    );

    return { items, loading, error, reload, create, update, remove };
}

