'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { FormActionResult, runFormAction } from '@/lib/form-action';
import { filterMatchEligiblePlayers, MatchPlayerOption } from '@/lib/goal-form';
import { createGoal, deleteGoal, listGoals, updateGoal } from '@/lib/goals-api';
import { listTeamPlayers } from '@/lib/team-players-api';
import { CreateGoalPayload, Goal, Match, UpdateGoalPayload } from '@/types/sports';

const sortGoals = (items: Goal[]) => [...items].sort((a, b) => a.minute - b.minute || a.id - b.id);

/**
 * Anotaciones de un partido y lista de jugadores participantes para el selector.
 */
export function useMatchGoals(match: Match | null, visible: boolean, canListGoals: boolean, canLoadPlayers: boolean) {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [playerOptions, setPlayerOptions] = useState<MatchPlayerOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!visible || !match || !canListGoals) {
            setGoals([]);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        listGoals({ matchId: match.id }, controller.signal)
            .then((items) => setGoals(sortGoals(items)))
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [visible, match, canListGoals, reloadKey]);

    useEffect(() => {
        if (!visible || !match || !canLoadPlayers) {
            setPlayerOptions([]);
            return;
        }
        const controller = new AbortController();
        setLoadingPlayers(true);

        Promise.all([
            listTeamPlayers({ teamId: match.homeTeam.id }, controller.signal),
            listTeamPlayers({ teamId: match.awayTeam.id }, controller.signal)
        ])
            .then(([homeContracts, awayContracts]) => {
                setPlayerOptions(filterMatchEligiblePlayers([...homeContracts, ...awayContracts], match));
            })
            .catch(() => {
                if (!controller.signal.aborted) setPlayerOptions([]);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingPlayers(false);
            });

        return () => controller.abort();
    }, [visible, match, canLoadPlayers]);

    const playerTeamMap = useMemo(() => {
        const map = new Map<number, string>();
        for (const option of playerOptions) {
            map.set(option.value, option.teamName);
        }
        return map;
    }, [playerOptions]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const create = useCallback(
        (payload: CreateGoalPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                const saved = await createGoal(payload);
                setGoals((current) => sortGoals([...current, saved]));
            }),
        []
    );

    const update = useCallback(
        (goalId: number, payload: UpdateGoalPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                const saved = await updateGoal(goalId, payload);
                setGoals((current) => sortGoals(current.map((item) => (item.id === saved.id ? saved : item))));
            }),
        []
    );

    const remove = useCallback(
        (goalId: number): Promise<FormActionResult> =>
            runFormAction(async () => {
                await deleteGoal(goalId);
                setGoals((current) => current.filter((item) => item.id !== goalId));
            }),
        []
    );

    return { goals, playerOptions, playerTeamMap, loading, loadingPlayers, error, reload, create, update, remove };
}
