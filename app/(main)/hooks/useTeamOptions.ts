'use client';

import { useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { listTeams } from '@/lib/teams-api';
import { Team } from '@/types/sports';

/** Equipos activos para los selectores. `enabled` = el usuario tiene GET /gestion-deportiva/teams. */
export function useTeamOptions(enabled: boolean) {
    const [teams, setTeams] = useState<Team[]>([]);
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

        listTeams({ active: true }, controller.signal)
            .then(setTeams)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [enabled]);

    return { teams, loading, error };
}
