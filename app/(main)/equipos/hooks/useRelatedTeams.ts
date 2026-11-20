'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { runFormAction } from '@/lib/form-action';
import { listRelatedTeams, relateTeam, unrelateTeam } from '@/lib/teams-api';
import { RelatedTeam } from '@/types/sports';

/**
 * Equipos relacionados (autorrelación Equipo n — n Equipo). `enabled` = el
 * usuario tiene GET /gestion-deportiva/teams/{id}/related-teams.
 */
export function useRelatedTeams(teamId: number, enabled: boolean) {
    const [relatedTeams, setRelatedTeams] = useState<RelatedTeam[]>([]);
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

        listRelatedTeams(teamId, controller.signal)
            .then(setRelatedTeams)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [teamId, enabled, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    // El backend responde la lista actualizada
    const relate = useCallback((relatedTeamId: number) => runFormAction(async () => setRelatedTeams((await relateTeam(teamId, relatedTeamId)).relatedTeams)), [teamId]);

    const unrelate = useCallback(
        (relatedTeamId: number) =>
            runFormAction(async () => {
                await unrelateTeam(teamId, relatedTeamId);
                setRelatedTeams((current) => current.filter((team) => team.id !== relatedTeamId));
            }),
        [teamId]
    );

    return { relatedTeams, loading, error, reload, relate, unrelate };
}
