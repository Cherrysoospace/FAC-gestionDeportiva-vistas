'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { runFormAction } from '@/lib/form-action';
import { createVenue, deleteVenue, listVenues, updateVenue } from '@/lib/venues-api';
import { CreateVenuePayload, UpdateVenuePayload, Venue } from '@/types/sports';

export interface VenueFilters {
    search: string;
    // true = solo escenarios principales (sin padre)
    roots: boolean;
    active: boolean | null;
}

// Los filtros se aplican en ms-sports (GET /venues?search&roots&active).
export function useVenues({ search, roots, active }: VenueFilters) {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        listVenues({ search: search.trim() || undefined, roots: roots || undefined, active: active ?? undefined }, controller.signal)
            .then(setVenues)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [search, roots, active, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    // Crear o mover un escenario cambia los conteos del padre: se recarga la lista
    const create = useCallback(
        (payload: CreateVenuePayload) =>
            runFormAction(async () => {
                await createVenue(payload);
                reload();
            }),
        [reload]
    );

    const update = useCallback(
        (id: number, payload: UpdateVenuePayload) =>
            runFormAction(async () => {
                await updateVenue(id, payload);
                reload();
            }),
        [reload]
    );

    const remove = useCallback(
        (id: number) =>
            runFormAction(async () => {
                await deleteVenue(id);
                setVenues((current) => current.filter((venue) => venue.id !== id));
            }),
        []
    );

    return { venues, loading, error, reload, create, update, remove };
}
