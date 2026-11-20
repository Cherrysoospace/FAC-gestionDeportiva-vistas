'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { runFormAction } from '@/lib/form-action';
import { createTeam, deleteTeam, listTeams, updateTeam } from '@/lib/teams-api';
import { CreateTeamPayload, Team, TeamModality, UpdateTeamPayload } from '@/types/sports';

export interface TeamFilters {
    search: string;
    sportId: number | null;
    modality: TeamModality | null;
    active: boolean | null;
}

// Los filtros se aplican en ms-sports (GET /teams?search&sportId&modality&active).
export function useTeams({ search, sportId, modality, active }: TeamFilters) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        listTeams(
            {
                search: search.trim() || undefined,
                sportId: sportId ?? undefined,
                modality: modality ?? undefined,
                active: active ?? undefined
            },
            controller.signal
        )
            .then(setTeams)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [search, sportId, modality, active, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    // Reemplaza la fila en su lugar para no perder el orden del backend
    const replaceLocal = useCallback((saved: Team) => {
        setTeams((current) => current.map((team) => (team.id === saved.id ? saved : team)));
    }, []);

    // Al crear se recarga: el equipo nuevo puede no cumplir los filtros actuales
    const create = useCallback(
        (payload: CreateTeamPayload) =>
            runFormAction(async () => {
                await createTeam(payload);
                reload();
            }),
        [reload]
    );

    const update = useCallback((id: number, payload: UpdateTeamPayload) => runFormAction(async () => replaceLocal(await updateTeam(id, payload))), [replaceLocal]);

    const remove = useCallback(
        (id: number) =>
            runFormAction(async () => {
                await deleteTeam(id);
                setTeams((current) => current.filter((team) => team.id !== id));
            }),
        []
    );

    return { teams, loading, error, reload, create, update, remove };
}
