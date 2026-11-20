'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { getBoard, getMatch } from '@/lib/matches-api';
import { Board, Match } from '@/types/sports';

export const BOARD_REFRESH_MS = 1500;

/**
 * Pizarra (HU-GC-09): lee el partido una vez y las posiciones cada
 * BOARD_REFRESH_MS mientras `autoRefresh` esté activo y el partido siga en
 * curso. Si una consulta tarda, no se acumulan: se espera a que termine.
 */
export function useBoard(matchId: number, autoRefresh: boolean) {
    const [match, setMatch] = useState<Match | null>(null);
    const [board, setBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const inFlight = useRef<AbortController | null>(null);

    const refresh = useCallback(async () => {
        if (inFlight.current) return;
        const controller = new AbortController();
        inFlight.current = controller;
        try {
            const next = await getBoard(matchId, controller.signal);
            setBoard(next);
            setError(null);
            setLastUpdate(new Date());
        } catch (cause) {
            if (!controller.signal.aborted) setError(describeError(cause));
        } finally {
            inFlight.current = null;
            setLoading(false);
        }
    }, [matchId]);

    useEffect(() => {
        const controller = new AbortController();
        getMatch(matchId, controller.signal)
            .then(setMatch)
            .catch((cause) => !controller.signal.aborted && setError(describeError(cause)));
        void refresh();
        return () => {
            controller.abort();
            inFlight.current?.abort();
        };
    }, [matchId, refresh]);

    // Refresco automático solo con el partido en curso
    const live = board?.status === 'IN_PROGRESS';
    useEffect(() => {
        if (!autoRefresh || !live) return;
        const timer = setInterval(() => void refresh(), BOARD_REFRESH_MS);
        return () => clearInterval(timer);
    }, [autoRefresh, live, refresh]);

    return { match, board, loading, error, lastUpdate, live, refresh };
}
