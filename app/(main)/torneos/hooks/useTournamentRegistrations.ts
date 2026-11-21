'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { runFormAction } from '@/lib/form-action';
import { createRegistrations, listRegistrations, withdrawRegistration } from '@/lib/registrations-api';
import { listTeams } from '@/lib/teams-api';
import { Registration, Team } from '@/types/sports';

/**
 * Inscripciones de un torneo y equipos elegibles de su deporte.
 * `enabled` = el usuario tiene GET /gestion-deportiva/registrations.
 * `canLoadTeams` = el usuario puede consultar equipos activos para inscribir.
 */
export function useTournamentRegistrations(tournamentId: number, sportId: number | null, enabled: boolean, canLoadTeams: boolean) {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
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

        listRegistrations({ tournamentId }, controller.signal)
            .then(setRegistrations)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [tournamentId, enabled, reloadKey]);

    useEffect(() => {
        if (!canLoadTeams || sportId === null) {
            setTeams([]);
            return;
        }
        const controller = new AbortController();
        listTeams({ active: true, sportId }, controller.signal)
            .then(setTeams)
            .catch(() => undefined);

        return () => controller.abort();
    }, [sportId, canLoadTeams]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const enroll = useCallback(
        (teamIds: number[], onSuccess?: (message: string) => void) =>
            runFormAction(async () => {
                const response = await createRegistrations({ tournamentId, teamIds });
                reload();
                onSuccess?.(response.message);
            }),
        [tournamentId, reload]
    );

    const withdraw = useCallback(
        (registrationId: number, onSuccess?: (message: string) => void) =>
            runFormAction(async () => {
                const response = await withdrawRegistration(registrationId);
                setRegistrations((current) => current.map((item) => (item.id === response.registration.id ? response.registration : item)));
                onSuccess?.(response.message);
            }),
        []
    );

    return { registrations, teams, loading, error, reload, enroll, withdraw };
}

