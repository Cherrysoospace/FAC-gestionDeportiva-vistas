'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '@/lib/api';
import { describeError } from '@/lib/api-errors';
import { FormActionResult, runFormAction } from '@/lib/form-action';
import {
    createPaymentMethod,
    deleteMyPaymentMethod,
    deletePaymentMethod,
    listMyPaymentMethods,
    listPaymentMethods,
    registerMyPaymentMethod,
    updateMyPaymentMethod,
    updatePaymentMethod
} from '@/lib/payment-methods-api';
import {
    CreatePaymentMethodPayload,
    FanPaymentMethod,
    PaymentMethod,
    PaymentMethodType,
    RegisterFanPaymentMethodPayload,
    UpdateFanPaymentMethodPayload,
    UpdatePaymentMethodPayload
} from '@/types/sports';

export interface UsePaymentMethodsOptions {
    loadCatalog: boolean;
    loadCatalogOptions: boolean;
    search: string;
    type: PaymentMethodType | null;
    active: boolean | null;
    loadMine: boolean;
    mineActive: boolean | null;
}

export function usePaymentMethods({
    loadCatalog,
    loadCatalogOptions,
    search,
    type,
    active,
    loadMine,
    mineActive
}: UsePaymentMethodsOptions) {
    const [catalog, setCatalog] = useState<PaymentMethod[]>([]);
    const [loadingCatalog, setLoadingCatalog] = useState(loadCatalog);
    const [catalogError, setCatalogError] = useState<string | null>(null);

    const [catalogOptions, setCatalogOptions] = useState<PaymentMethod[]>([]);

    const [myMethods, setMyMethods] = useState<FanPaymentMethod[]>([]);
    const [loadingMine, setLoadingMine] = useState(loadMine);
    const [mineError, setMineError] = useState<string | null>(null);
    const [profileMissing, setProfileMissing] = useState(false);

    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!loadCatalog) {
            setCatalog([]);
            setLoadingCatalog(false);
            return;
        }
        const controller = new AbortController();
        setLoadingCatalog(true);
        setCatalogError(null);

        listPaymentMethods(
            {
                search: search.trim() || undefined,
                type: type ?? undefined,
                active: active ?? undefined
            },
            controller.signal
        )
            .then(setCatalog)
            .catch((cause) => {
                if (!controller.signal.aborted) setCatalogError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingCatalog(false);
            });

        return () => controller.abort();
    }, [loadCatalog, search, type, active, reloadKey]);

    useEffect(() => {
        if (!loadCatalogOptions) {
            setCatalogOptions([]);
            return;
        }
        const controller = new AbortController();
        listPaymentMethods({ active: true }, controller.signal)
            .then(setCatalogOptions)
            .catch(() => undefined);

        return () => controller.abort();
    }, [loadCatalogOptions, reloadKey]);

    useEffect(() => {
        if (!loadMine) {
            setMyMethods([]);
            setLoadingMine(false);
            return;
        }
        const controller = new AbortController();
        setLoadingMine(true);
        setMineError(null);

        listMyPaymentMethods({ active: mineActive ?? undefined }, controller.signal)
            .then((items) => {
                setMyMethods(items);
                setProfileMissing(false);
            })
            .catch((cause) => {
                if (controller.signal.aborted) return;
                if (cause instanceof ApiRequestError && cause.status === 404) {
                    setMyMethods([]);
                    setProfileMissing(true);
                } else {
                    setMineError(describeError(cause));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingMine(false);
            });

        return () => controller.abort();
    }, [loadMine, mineActive, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    const createCatalog = useCallback(
        (payload: CreatePaymentMethodPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                await createPaymentMethod(payload);
                reload();
            }),
        [reload]
    );

    const updateCatalog = useCallback(
        (id: number, payload: UpdatePaymentMethodPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                await updatePaymentMethod(id, payload);
                reload();
            }),
        [reload]
    );

    const removeCatalog = useCallback(
        (id: number): Promise<FormActionResult> =>
            runFormAction(async () => {
                await deletePaymentMethod(id);
                setCatalog((current) => current.filter((item) => item.id !== id));
                setCatalogOptions((current) => current.filter((item) => item.id !== id));
            }),
        []
    );

    const registerMine = useCallback(
        (payload: RegisterFanPaymentMethodPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                await registerMyPaymentMethod(payload);
                reload();
            }),
        [reload]
    );

    const updateMine = useCallback(
        (id: number, payload: UpdateFanPaymentMethodPayload): Promise<FormActionResult> =>
            runFormAction(async () => {
                await updateMyPaymentMethod(id, payload);
                reload();
            }),
        [reload]
    );

    const removeMine = useCallback(
        (id: number): Promise<FormActionResult> =>
            runFormAction(async () => {
                await deleteMyPaymentMethod(id);
                setMyMethods((current) => current.filter((item) => item.id !== id));
                if (loadCatalog) reload();
            }),
        [loadCatalog, reload]
    );

    return {
        catalog,
        loadingCatalog,
        catalogError,
        catalogOptions,
        myMethods,
        loadingMine,
        mineError,
        profileMissing,
        reload,
        createCatalog,
        updateCatalog,
        removeCatalog,
        registerMine,
        updateMine,
        removeMine
    };
}

