'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '@/lib/api';
import { describeError } from '@/lib/api-errors';
import { listFans } from '@/lib/fans-api';
import { FormActionResult, runFormAction } from '@/lib/form-action';
import { listMatches } from '@/lib/matches-api';
import {
    createTicket,
    deleteMyTicket,
    deleteTicket,
    getMatchTicketAvailability,
    listMyTickets,
    listTickets,
    purchaseMyTicket
} from '@/lib/tickets-api';
import { listTournaments } from '@/lib/tournaments-api';
import {
    CreateTicketPayload,
    Fan,
    Match,
    MatchTicketAvailability,
    PurchaseTicketPayload,
    Ticket,
    Tournament
} from '@/types/sports';

export interface UseTicketsOptions {
    canViewAdmin: boolean;
    canViewMine: boolean;
    canLoadAvailability: boolean;
    canLoadMatches: boolean;
    canLoadTournaments: boolean;
    canLoadFans: boolean;
    availabilityMatchId: number | null;
    adminFilters: {
        matchId: number | null;
        fanId: number | null;
        tournamentId: number | null;
        code: string;
    };
    myFilters: {
        matchId: number | null;
        tournamentId: number | null;
    };
}

export function useTickets({
    canViewAdmin,
    canViewMine,
    canLoadAvailability,
    canLoadMatches,
    canLoadTournaments,
    canLoadFans,
    availabilityMatchId,
    adminFilters,
    myFilters
}: UseTicketsOptions) {
    const [myTickets, setMyTickets] = useState<Ticket[]>([]);
    const [loadingMine, setLoadingMine] = useState(canViewMine);
    const [mineError, setMineError] = useState<string | null>(null);
    const [profileMissing, setProfileMissing] = useState(false);

    const [adminTickets, setAdminTickets] = useState<Ticket[]>([]);
    const [loadingAdmin, setLoadingAdmin] = useState(canViewAdmin);
    const [adminError, setAdminError] = useState<string | null>(null);

    const [availability, setAvailability] = useState<MatchTicketAvailability | null>(null);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);

    const [matches, setMatches] = useState<Match[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [fans, setFans] = useState<Fan[]>([]);

    const [reloadKey, setReloadKey] = useState(0);

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
    }, [canLoadMatches, reloadKey]);

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
            setMyTickets([]);
            setLoadingMine(false);
            return;
        }
        const controller = new AbortController();
        setLoadingMine(true);
        setMineError(null);

        listMyTickets(
            {
                matchId: myFilters.matchId ?? undefined,
                tournamentId: myFilters.tournamentId ?? undefined
            },
            controller.signal
        )
            .then((items) => {
                setMyTickets(items);
                setProfileMissing(false);
            })
            .catch((cause) => {
                if (controller.signal.aborted) return;
                if (cause instanceof ApiRequestError && cause.status === 404) {
                    setMyTickets([]);
                    setProfileMissing(true);
                } else {
                    setMineError(describeError(cause));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingMine(false);
            });

        return () => controller.abort();
    }, [canViewMine, myFilters.matchId, myFilters.tournamentId, reloadKey]);

    useEffect(() => {
        if (!canViewAdmin) {
            setAdminTickets([]);
            setLoadingAdmin(false);
            return;
        }
        const controller = new AbortController();
        setLoadingAdmin(true);
        setAdminError(null);

        listTickets(
            {
                matchId: adminFilters.matchId ?? undefined,
                fanId: adminFilters.fanId ?? undefined,
                tournamentId: adminFilters.tournamentId ?? undefined,
                code: adminFilters.code.trim() || undefined
            },
            controller.signal
        )
            .then(setAdminTickets)
            .catch((cause) => {
                if (!controller.signal.aborted) setAdminError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingAdmin(false);
            });

        return () => controller.abort();
    }, [
        canViewAdmin,
        adminFilters.matchId,
        adminFilters.fanId,
        adminFilters.tournamentId,
        adminFilters.code,
        reloadKey
    ]);

    useEffect(() => {
        if (!canLoadAvailability || availabilityMatchId === null) {
            setAvailability(null);
            setLoadingAvailability(false);
            setAvailabilityError(null);
            return;
        }
        const controller = new AbortController();
        setLoadingAvailability(true);
        setAvailabilityError(null);

        getMatchTicketAvailability(availabilityMatchId, controller.signal)
            .then(setAvailability)
            .catch((cause) => {
                if (!controller.signal.aborted) {
                    setAvailability(null);
                    setAvailabilityError(describeError(cause));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingAvailability(false);
            });

        return () => controller.abort();
    }, [canLoadAvailability, availabilityMatchId, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const purchaseMine = useCallback(
        (payload: PurchaseTicketPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                await purchaseMyTicket(payload);
                reload();
            }),
        [reload]
    );

    const createAdmin = useCallback(
        (payload: CreateTicketPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                await createTicket(payload);
                reload();
            }),
        [reload]
    );

    const removeMine = useCallback(
        (id: number): Promise<FormActionResult> =>
            runFormAction(async () => {
                await deleteMyTicket(id);
                reload();
            }),
        [reload]
    );

    const removeAdmin = useCallback(
        (id: number): Promise<FormActionResult> =>
            runFormAction(async () => {
                await deleteTicket(id);
                reload();
            }),
        [reload]
    );

    return {
        myTickets,
        loadingMine,
        mineError,
        profileMissing,
        adminTickets,
        loadingAdmin,
        adminError,
        availability,
        loadingAvailability,
        availabilityError,
        matches,
        tournaments,
        fans,
        reload,
        purchaseMine,
        createAdmin,
        removeMine,
        removeAdmin
    };
}

