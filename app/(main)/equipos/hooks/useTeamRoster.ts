'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { runFormAction } from '@/lib/form-action';
import { createTeamPlayer, listTeamPlayers, releaseTeamPlayer, updateTeamPlayer } from '@/lib/team-players-api';
import { CreateTeamPlayerPayload, ReleaseTeamPlayerPayload, TeamPlayer, UpdateTeamPlayerPayload } from '@/types/sports';

/**
 * HU-GD-05: plantilla del equipo (contratos vigentes y próximos) e historial
 * de traspasos. `enabled` = GET /gestion-deportiva/team-players.
 * `onChange` recarga el equipo (cambia su número de jugadores).
 */
export function useTeamRoster(teamId: number, enabled: boolean, onChange: () => void) {
    const [contracts, setContracts] = useState<TeamPlayer[]>([]);
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

        listTeamPlayers({ teamId }, controller.signal)
            .then(setContracts)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [teamId, enabled, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    // La etapa (stage) la calcula el backend: plantilla = vigentes y próximos; historial = el resto
    const roster = useMemo(() => contracts.filter((contract) => contract.stage !== 'PAST'), [contracts]);
    const history = useMemo(() => contracts.filter((contract) => contract.stage === 'PAST'), [contracts]);

    const afterChange = useCallback(() => {
        reload();
        onChange();
    }, [reload, onChange]);

    const assign = useCallback(
        (payload: CreateTeamPlayerPayload) =>
            runFormAction(async () => {
                await createTeamPlayer(payload);
                afterChange();
            }),
        [afterChange]
    );

    const update = useCallback(
        (id: number, payload: UpdateTeamPlayerPayload) =>
            runFormAction(async () => {
                await updateTeamPlayer(id, payload);
                afterChange();
            }),
        [afterChange]
    );

    const release = useCallback(
        (id: number, payload: ReleaseTeamPlayerPayload) =>
            runFormAction(async () => {
                await releaseTeamPlayer(id, payload);
                afterChange();
            }),
        [afterChange]
    );

    return { roster, history, loading, error, reload, assign, update, release };
}
