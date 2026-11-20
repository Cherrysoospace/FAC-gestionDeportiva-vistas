'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { runFormAction } from '@/lib/form-action';
import { createLocation, deleteLocation, listLocations, updateLocation } from '@/lib/locations-api';
import { CreateLocationPayload, Location, UpdateLocationPayload } from '@/types/sports';

/**
 * Localidades de un escenario. `enabled` = el usuario tiene
 * GET /gestion-deportiva/locations. `onChange` avisa para recargar los totales del escenario.
 */
export function useLocations(venueId: number, enabled: boolean, onChange: () => void) {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        listLocations({ venueId }, controller.signal)
            .then(setLocations)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [venueId, enabled, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const create = useCallback(
        (payload: CreateLocationPayload) =>
            runFormAction(async () => {
                await createLocation(payload);
                reload();
                onChange();
            }),
        [reload, onChange]
    );

    const update = useCallback(
        (id: number, payload: UpdateLocationPayload) =>
            runFormAction(async () => {
                const saved = await updateLocation(id, payload);
                setLocations((current) => current.map((location) => (location.id === saved.id ? saved : location)));
                onChange();
            }),
        [onChange]
    );

    const remove = useCallback(
        (id: number) =>
            runFormAction(async () => {
                await deleteLocation(id);
                setLocations((current) => current.filter((location) => location.id !== id));
                onChange();
            }),
        [onChange]
    );

    return { locations, loading, error, reload, create, update, remove };
}
