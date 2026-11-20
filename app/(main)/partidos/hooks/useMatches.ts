'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { runFormAction } from '@/lib/form-action';
import { createMatch, deleteMatch, listMatches, updateMatch } from '@/lib/matches-api';
import { CreateMatchPayload, Match, MatchStatus, UpdateMatchPayload } from '@/types/sports';

export interface MatchFilters {
    tournamentId: number | null;
    status: MatchStatus | null;
}

// Los filtros se aplican en ms-sports (GET /matches?tournamentId&status).
export function useMatches({ tournamentId, status }: MatchFilters) {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        listMatches({ tournamentId: tournamentId ?? undefined, status: status ?? undefined }, controller.signal)
            .then(setMatches)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [tournamentId, status, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const replaceLocal = useCallback((saved: Match) => {
        setMatches((current) => current.map((match) => (match.id === saved.id ? saved : match)));
    }, []);

    // Al crear se recarga para respetar el orden por fecha del backend
    const create = useCallback(
        (payload: CreateMatchPayload) =>
            runFormAction(async () => {
                await createMatch(payload);
                reload();
            }),
        [reload]
    );

    const update = useCallback((id: number, payload: UpdateMatchPayload) => runFormAction(async () => replaceLocal(await updateMatch(id, payload))), [replaceLocal]);

    const changeStatus = useCallback((id: number, next: MatchStatus) => update(id, { status: next }), [update]);

    const remove = useCallback(
        (id: number) =>
            runFormAction(async () => {
                await deleteMatch(id);
                setMatches((current) => current.filter((match) => match.id !== id));
            }),
        []
    );

    return { matches, loading, error, reload, create, update, changeStatus, remove };
}
