'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { getTournamentDevelopment } from '@/lib/tournament-development-api';
import { TournamentDevelopment } from '@/types/sports';

/**
 * Desarrollo del torneo (HU-GC-08b). Solo lectura: se consulta al abrir la
 * pestaña y con "Actualizar".
 */
export function useTournamentDevelopment(tournamentId: number) {
    const [development, setDevelopment] = useState<TournamentDevelopment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        getTournamentDevelopment(tournamentId, controller.signal)
            .then(setDevelopment)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [tournamentId, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    return { development, loading, error, reload };
}
