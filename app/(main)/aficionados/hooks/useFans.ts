'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { createFan, deleteFan, listFans, updateFan } from '@/lib/fans-api';
import { FormActionResult, runFormAction } from '@/lib/form-action';
import { CreateFanPayload, Fan, UpdateFanPayload } from '@/types/sports';

export interface FanFilters {
    search: string;
    active: boolean | null;
}

export function useFans({ search, active }: FanFilters) {
    const [fans, setFans] = useState<Fan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        listFans({ search: search.trim() || undefined, active: active ?? undefined }, controller.signal)
            .then(setFans)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [search, active, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const create = useCallback(
        (payload: CreateFanPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                const created = await createFan(payload);
                setFans((current) => [...current, created].sort((a, b) => a.fullName.localeCompare(b.fullName)));
            }),
        []
    );

    const update = useCallback(
        (id: number, payload: UpdateFanPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                const saved = await updateFan(id, payload);
                setFans((current) => current.map((item) => (item.id === saved.id ? saved : item)));
            }),
        []
    );

    const remove = useCallback(
        (id: number): Promise<FormActionResult> =>
            runFormAction(async () => {
                await deleteFan(id);
                setFans((current) => current.filter((item) => item.id !== id));
            }),
        []
    );

    return { fans, loading, error, reload, create, update, remove };
}
