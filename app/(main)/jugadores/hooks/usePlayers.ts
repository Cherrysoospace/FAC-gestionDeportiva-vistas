'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { runFormAction } from '@/lib/form-action';
import { createPlayer, deletePlayer, listPlayers, updatePlayer } from '@/lib/players-api';
import { CreatePlayerPayload, Player, UpdatePlayerPayload } from '@/types/sports';

export interface PlayerFilters {
    search: string;
    teamId: number | null;
    sportId: number | null;
    active: boolean | null;
}

// Los filtros se aplican en ms-sports (GET /players?search&teamId&sportId&active).
export function usePlayers({ search, teamId, sportId, active }: PlayerFilters) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        listPlayers({ search: search.trim() || undefined, teamId: teamId ?? undefined, sportId: sportId ?? undefined, active: active ?? undefined }, controller.signal)
            .then(setPlayers)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [search, teamId, sportId, active, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const replaceLocal = useCallback((saved: Player) => {
        setPlayers((current) => current.map((player) => (player.id === saved.id ? saved : player)));
    }, []);

    // Al crear se recarga: el jugador nuevo puede no cumplir los filtros actuales
    const create = useCallback(
        (payload: CreatePlayerPayload) =>
            runFormAction(async () => {
                await createPlayer(payload);
                reload();
            }),
        [reload]
    );

    const update = useCallback((id: number, payload: UpdatePlayerPayload) => runFormAction(async () => replaceLocal(await updatePlayer(id, payload))), [replaceLocal]);

    const remove = useCallback(
        (id: number) =>
            runFormAction(async () => {
                await deletePlayer(id);
                setPlayers((current) => current.filter((player) => player.id !== id));
            }),
        []
    );

    return { players, loading, error, reload, create, update, remove };
}
