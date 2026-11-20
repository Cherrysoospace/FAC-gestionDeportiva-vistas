'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { runFormAction } from '@/lib/form-action';
import { createTournamentVenue, deleteTournamentVenue, listTournamentVenues } from '@/lib/tournament-venues-api';
import { TournamentVenue } from '@/types/sports';

/**
 * Escenarios habilitados para un torneo (Escenario-Torneo). `enabled` = el
 * usuario tiene GET /gestion-deportiva/tournament-venues.
 */
export function useTournamentVenues(tournamentId: number, enabled: boolean) {
    const [tournamentVenues, setTournamentVenues] = useState<TournamentVenue[]>([]);
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

        listTournamentVenues({ tournamentId }, controller.signal)
            .then(setTournamentVenues)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [tournamentId, enabled, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const enable = useCallback(
        (venueId: number) =>
            runFormAction(async () => {
                const saved = await createTournamentVenue({ tournamentId, venueId });
                setTournamentVenues((current) => [...current, saved].sort((a, b) => a.venue.name.localeCompare(b.venue.name)));
            }),
        [tournamentId]
    );

    const remove = useCallback(
        (id: number) =>
            runFormAction(async () => {
                await deleteTournamentVenue(id);
                setTournamentVenues((current) => current.filter((tournamentVenue) => tournamentVenue.id !== id));
            }),
        []
    );

    return { tournamentVenues, loading, error, reload, enable, remove };
}
