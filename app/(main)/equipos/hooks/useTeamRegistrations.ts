'use client';

import { useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { listRegistrations } from '@/lib/registrations-api';
import { Registration } from '@/types/sports';

/**
 * Torneos en los que está (o estuvo) inscrito un equipo. `enabled` = el
 * usuario tiene GET /gestion-deportiva/registrations; si no, no se consulta.
 */
export function useTeamRegistrations(teamId: number, enabled: boolean) {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        listRegistrations({ teamId }, controller.signal)
            .then(setRegistrations)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [teamId, enabled]);

    return { registrations, loading, error };
}
