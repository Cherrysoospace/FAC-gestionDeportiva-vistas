'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { runFormAction } from '@/lib/form-action';
import { getPlayerProfile, updatePlayer } from '@/lib/players-api';
import { PlayerProfile, UpdatePlayerPayload } from '@/types/sports';

// HU-GD-08: perfil deportivo (datos, equipos y habilidades) en una sola consulta.
export function usePlayerProfile(playerId: number) {
    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadError(null);

        getPlayerProfile(playerId, controller.signal)
            .then(setProfile)
            .catch((cause) => {
                if (!controller.signal.aborted) setLoadError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [playerId, reloadKey]);

    // Se recarga después de cambiar habilidades o datos del jugador
    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const update = useCallback(
        (payload: UpdatePlayerPayload) =>
            runFormAction(async () => {
                const player = await updatePlayer(playerId, payload);
                setProfile((current) => (current ? { ...current, player } : current));
            }),
        [playerId]
    );

    return { profile, loading, loadError, reload, update };
}
