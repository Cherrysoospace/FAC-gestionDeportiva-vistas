'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '@/lib/api';
import { describeError } from '@/lib/api-errors';
import {
    cancelMyBet,
    createBet,
    listAvailableBetMatches,
    listBets,
    listMyBets,
    placeMyBet,
    updateMyBet,
    voidBet
} from '@/lib/bets-api';
import { listFans } from '@/lib/fans-api';
import { FormActionResult, runFormAction } from '@/lib/form-action';
import { listMatches } from '@/lib/matches-api';
import { listMyPaymentMethods } from '@/lib/payment-methods-api';
import { listTournaments } from '@/lib/tournaments-api';
import {
    Bet,
    BetStatus,
    CancelBetPayload,
    CreateBetPayload,
    Fan,
    FanPaymentMethod,
    Match,
    PlaceBetPayload,
    Tournament,
    UpdateMyBetPayload
} from '@/types/sports';

export interface UseBetsOptions {
    canViewAdmin: boolean;
    canViewMine: boolean;
    canLoadAvailableMatches: boolean;
    canLoadMyPaymentMethods: boolean;
    canLoadMatches: boolean;
    canLoadTournaments: boolean;
    canLoadFans: boolean;
    myFilters: {
        status: BetStatus | null;
        tournamentId: number | null;
    };
    adminFilters: {
        status: BetStatus | null;
        tournamentId: number | null;
        matchId: number | null;
        fanId: number | null;
    };
}

export function useBets({
    canViewAdmin,
    canViewMine,
    canLoadAvailableMatches,
    canLoadMyPaymentMethods,
    canLoadMatches,
    canLoadTournaments,
    canLoadFans,
    myFilters,
    adminFilters
}: UseBetsOptions) {
    const [myBets, setMyBets] = useState<Bet[]>([]);
    const [loadingMine, setLoadingMine] = useState(canViewMine);
    const [mineError, setMineError] = useState<string | null>(null);
    const [profileMissing, setProfileMissing] = useState(false);

    const [adminBets, setAdminBets] = useState<Bet[]>([]);
    const [loadingAdmin, setLoadingAdmin] = useState(canViewAdmin);
    const [adminError, setAdminError] = useState<string | null>(null);

    const [availableMatches, setAvailableMatches] = useState<Match[]>([]);
    const [loadingAvailableMatches, setLoadingAvailableMatches] = useState(canLoadAvailableMatches);

    const [myPaymentMethods, setMyPaymentMethods] = useState<FanPaymentMethod[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [fans, setFans] = useState<Fan[]>([]);

    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!canLoadAvailableMatches) {
            setAvailableMatches([]);
            setLoadingAvailableMatches(false);
            return;
        }
        const controller = new AbortController();
        setLoadingAvailableMatches(true);

        listAvailableBetMatches({}, controller.signal)
            .then(setAvailableMatches)
            .catch(() => undefined)
            .finally(() => {
                if (!controller.signal.aborted) setLoadingAvailableMatches(false);
            });

        return () => controller.abort();
    }, [canLoadAvailableMatches, reloadKey]);

    useEffect(() => {
        if (!canLoadMyPaymentMethods) {
            setMyPaymentMethods([]);
            return;
        }
        const controller = new AbortController();
        listMyPaymentMethods({ active: true }, controller.signal)
            .then(setMyPaymentMethods)
            .catch(() => setMyPaymentMethods([]));

        return () => controller.abort();
    }, [canLoadMyPaymentMethods, reloadKey]);

    useEffect(() => {
        if (!canLoadMatches) {
            setMatches([]);
            return;
        }
        const controller = new AbortController();
        listMatches({}, controller.signal)
            .then(setMatches)
            .catch(() => undefined);

        return () => controller.abort();
    }, [canLoadMatches]);

    useEffect(() => {
        if (!canLoadTournaments) {
            setTournaments([]);
            return;
        }
        const controller = new AbortController();
        listTournaments({}, controller.signal)
            .then(setTournaments)
            .catch(() => undefined);

        return () => controller.abort();
    }, [canLoadTournaments]);

    useEffect(() => {
        if (!canLoadFans) {
            setFans([]);
            return;
        }
        const controller = new AbortController();
        listFans({ active: true }, controller.signal)
            .then(setFans)
            .catch(() => undefined);

        return () => controller.abort();
    }, [canLoadFans]);

    useEffect(() => {
        if (!canViewMine) {
            setMyBets([]);
            setLoadingMine(false);
            return;
        }
        const controller = new AbortController();
        setLoadingMine(true);
        setMineError(null);

        listMyBets(
            {
                status: myFilters.status ?? undefined,
                tournamentId: myFilters.tournamentId ?? undefined
            },
            controller.signal
        )
            .then((items) => {
                setMyBets(items);
                setProfileMissing(false);
            })
            .catch((cause) => {
                if (controller.signal.aborted) return;
                if (cause instanceof ApiRequestError && cause.status === 404) {
                    setMyBets([]);
                    setProfileMissing(true);
                } else {
                    setMineError(describeError(cause));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingMine(false);
            });

        return () => controller.abort();
    }, [canViewMine, myFilters.status, myFilters.tournamentId, reloadKey]);

    useEffect(() => {
        if (!canViewAdmin) {
            setAdminBets([]);
            setLoadingAdmin(false);
            return;
        }
        const controller = new AbortController();
        setLoadingAdmin(true);
        setAdminError(null);

        listBets(
            {
                status: adminFilters.status ?? undefined,
                tournamentId: adminFilters.tournamentId ?? undefined,
                matchId: adminFilters.matchId ?? undefined,
                fanId: adminFilters.fanId ?? undefined
            },
            controller.signal
        )
            .then(setAdminBets)
            .catch((cause) => {
                if (!controller.signal.aborted) setAdminError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingAdmin(false);
            });

        return () => controller.abort();
    }, [
        canViewAdmin,
        adminFilters.status,
        adminFilters.tournamentId,
        adminFilters.matchId,
        adminFilters.fanId,
        reloadKey
    ]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const placeMine = useCallback(
        (payload: PlaceBetPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                await placeMyBet(payload);
                reload();
            }),
        [reload]
    );

    const updateMine = useCallback(
        (id: number, payload: UpdateMyBetPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                await updateMyBet(id, payload);
                reload();
            }),
        [reload]
    );

    const cancelMine = useCallback(
        (id: number, payload: CancelBetPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                await cancelMyBet(id, payload);
                reload();
            }),
        [reload]
    );

    const createAdmin = useCallback(
        (payload: CreateBetPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                await createBet(payload);
                reload();
            }),
        [reload]
    );

    const voidByAdmin = useCallback(
        (id: number, payload: CancelBetPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                await voidBet(id, payload);
                reload();
            }),
        [reload]
    );

    return {
        myBets,
        loadingMine,
        mineError,
        profileMissing,
        adminBets,
        loadingAdmin,
        adminError,
        availableMatches,
        loadingAvailableMatches,
        myPaymentMethods,
        matches,
        tournaments,
        fans,
        reload,
        placeMine,
        updateMine,
        cancelMine,
        createAdmin,
        voidByAdmin
    };
}

