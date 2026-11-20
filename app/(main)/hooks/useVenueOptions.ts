'use client';

import { useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { listVenues } from '@/lib/venues-api';
import { Venue } from '@/types/sports';

/** Escenarios activos para elegir el escenario padre. `enabled` = el usuario tiene GET /gestion-deportiva/venues. */
export function useVenueOptions(enabled: boolean) {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) return;
        const controller = new AbortController();
        setError(null);

        listVenues({ active: true }, controller.signal)
            .then(setVenues)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            });

        return () => controller.abort();
    }, [enabled]);

    return { venues, error };
}
