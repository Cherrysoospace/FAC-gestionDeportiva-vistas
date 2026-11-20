'use client';

import { useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { listPlayers } from '@/lib/players-api';
import { Player } from '@/types/sports';

/** Jugadores activos para los selectores. `enabled` = el usuario tiene GET /gestion-deportiva/players. */
export function usePlayerOptions(enabled: boolean) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        listPlayers({ active: true }, controller.signal)
            .then(setPlayers)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [enabled]);

    return { players, loading, error };
}
