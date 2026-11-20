'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { runFormAction } from '@/lib/form-action';
import { createTeamSport, deleteTeamSport, listTeamSports } from '@/lib/team-sports-api';
import { TeamSportAssociation } from '@/types/sports';

/**
 * Deportes asociados a un equipo (HU-GD-03). `enabled` = el usuario tiene
 * GET /gestion-deportiva/team-sports; si no, no se consulta.
 */
export function useTeamSports(teamId: number, enabled: boolean) {
    const [associations, setAssociations] = useState<TeamSportAssociation[]>([]);
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

        listTeamSports({ teamId }, controller.signal)
            .then(setAssociations)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [teamId, enabled, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const associate = useCallback(
        (sportId: number) =>
            runFormAction(async () => {
                const saved = await createTeamSport({ teamId, sportId });
                setAssociations((current) => [...current, saved].sort((a, b) => a.sport.name.localeCompare(b.sport.name)));
            }),
        [teamId]
    );

    const remove = useCallback(
        (associationId: number) =>
            runFormAction(async () => {
                await deleteTeamSport(associationId);
                setAssociations((current) => current.filter((association) => association.id !== associationId));
            }),
        []
    );

    return { associations, loading, error, reload, associate, remove };
}
