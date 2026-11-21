'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '@/lib/api';
import { describeError } from '@/lib/api-errors';
import {
    addMyFavoriteTeam,
    getMyFanProfile,
    listMyFavoriteTeams,
    registerMyFanProfile,
    removeMyFavoriteTeam,
    updateMyFanProfile
} from '@/lib/fans-api';
import { FormActionResult, runFormAction } from '@/lib/form-action';
import { listTeams } from '@/lib/teams-api';
import { Fan, FavoriteTeam, RegisterMyFanPayload, Team, UpdateMyFanPayload } from '@/types/sports';

interface UseMyFanProfileOptions {
    loadProfile: boolean;
    loadFavorites: boolean;
    loadTeamOptions: boolean;
}

export function useMyFanProfile({ loadProfile, loadFavorites, loadTeamOptions }: UseMyFanProfileOptions) {
    const [fan, setFan] = useState<Fan | null>(null);
    const [notRegistered, setNotRegistered] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(loadProfile);
    const [profileError, setProfileError] = useState<string | null>(null);

    const [favorites, setFavorites] = useState<FavoriteTeam[]>([]);
    const [loadingFavorites, setLoadingFavorites] = useState(loadFavorites);
    const [favoritesError, setFavoritesError] = useState<string | null>(null);

    const [teams, setTeams] = useState<Team[]>([]);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!loadProfile) {
            setLoadingProfile(false);
            return;
        }
        const controller = new AbortController();
        setLoadingProfile(true);
        setProfileError(null);

        getMyFanProfile(controller.signal)
            .then((profile) => {
                setFan(profile);
                setNotRegistered(false);
            })
            .catch((cause) => {
                if (controller.signal.aborted) return;
                if (cause instanceof ApiRequestError && cause.status === 404) {
                    setFan(null);
                    setNotRegistered(true);
                } else {
                    setProfileError(describeError(cause));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingProfile(false);
            });

        return () => controller.abort();
    }, [loadProfile, reloadKey]);

    useEffect(() => {
        if (!loadFavorites) {
            setLoadingFavorites(false);
            return;
        }
        const controller = new AbortController();
        setLoadingFavorites(true);
        setFavoritesError(null);

        listMyFavoriteTeams(controller.signal)
            .then((items) => {
                setFavorites(items);
                setNotRegistered(false);
            })
            .catch((cause) => {
                if (controller.signal.aborted) return;
                if (cause instanceof ApiRequestError && cause.status === 404) {
                    setFavorites([]);
                    setNotRegistered(true);
                } else {
                    setFavoritesError(describeError(cause));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingFavorites(false);
            });

        return () => controller.abort();
    }, [loadFavorites, reloadKey]);

    useEffect(() => {
        if (!loadTeamOptions) {
            setTeams([]);
            return;
        }
        const controller = new AbortController();
        listTeams({ active: true }, controller.signal)
            .then(setTeams)
            .catch(() => undefined);

        return () => controller.abort();
    }, [loadTeamOptions]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const registerProfile = useCallback(
        (payload: RegisterMyFanPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                const created = await registerMyFanProfile(payload);
                setFan(created);
                setNotRegistered(false);
                setReloadKey((key) => key + 1);
            }),
        []
    );

    const updateProfile = useCallback(
        (payload: UpdateMyFanPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                const updated = await updateMyFanProfile(payload);
                setFan(updated);
            }),
        []
    );

    const addFavorite = useCallback(
        (teamId: number): Promise<FormActionResult> =>
            runFormAction(async () => {
                const added = await addMyFavoriteTeam({ teamId });
                setFavorites((current) => [added, ...current]);
                setFan((current) => (current ? { ...current, favoriteTeamsCount: current.favoriteTeamsCount + 1 } : current));
            }),
        []
    );

    const removeFavorite = useCallback(
        (teamId: number): Promise<FormActionResult> =>
            runFormAction(async () => {
                await removeMyFavoriteTeam(teamId);
                setFavorites((current) => current.filter((item) => item.team.id !== teamId));
                setFan((current) =>
                    current ? { ...current, favoriteTeamsCount: Math.max(0, current.favoriteTeamsCount - 1) } : current
                );
            }),
        []
    );

    return {
        fan,
        notRegistered,
        loadingProfile,
        profileError,
        favorites,
        loadingFavorites,
        favoritesError,
        teams,
        reload,
        registerProfile,
        updateProfile,
        addFavorite,
        removeFavorite
    };
}
