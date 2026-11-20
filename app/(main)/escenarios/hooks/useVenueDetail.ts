'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { runFormAction } from '@/lib/form-action';
import { createVenue, getVenue, updateVenue } from '@/lib/venues-api';
import { CreateVenuePayload, UpdateVenuePayload, Venue } from '@/types/sports';

// Detalle del escenario con sus espacios internos (children) y totales de localidades.
export function useVenueDetail(venueId: number) {
    const [venue, setVenue] = useState<Venue | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadError(null);

        getVenue(venueId, controller.signal)
            .then(setVenue)
            .catch((cause) => {
                if (!controller.signal.aborted) setLoadError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [venueId, reloadKey]);

    // Los totales de localidades vienen en el detalle: se recarga al cambiarlas
    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const update = useCallback(
        (payload: UpdateVenuePayload) =>
            runFormAction(async () => {
                await updateVenue(venueId, payload);
                reload();
            }),
        [venueId, reload]
    );

    // Espacio interno de este escenario
    const createChild = useCallback(
        (payload: CreateVenuePayload) =>
            runFormAction(async () => {
                await createVenue({ ...payload, parentId: venueId });
                reload();
            }),
        [venueId, reload]
    );

    return { venue, loading, loadError, reload, update, createChild };
}
