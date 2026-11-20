'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { runFormAction } from '@/lib/form-action';
import { getTeam, updateTeam } from '@/lib/teams-api';
import { Team, UpdateTeamPayload } from '@/types/sports';

export function useTeamDetail(teamId: number) {
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadError(null);

        getTeam(teamId, controller.signal)
            .then(setTeam)
            .catch((cause) => {
                if (!controller.signal.aborted) setLoadError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [teamId, reloadKey]);

    const update = useCallback((payload: UpdateTeamPayload) => runFormAction(async () => setTeam(await updateTeam(teamId, payload))), [teamId]);

    // Los deportes del equipo vienen en la respuesta: se recarga al asociar o retirar
    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    return { team, loading, loadError, update, reload };
}
