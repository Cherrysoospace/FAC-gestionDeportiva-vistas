'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { describeError } from '@/lib/api-errors';
import { FormActionResult } from '@/lib/form-action';
import { canPurchaseTicketForMatch, createEmptyTicketForm, TicketFormValues, validateTicketForm } from '@/lib/ticket-form';
import { getMatchTicketAvailability } from '@/lib/tickets-api';
import { formatDateTime } from '@/lib/tournament-labels';
import { Fan, Match, MatchTicketAvailability } from '@/types/sports';

interface TicketPurchaseDialogProps {
    visible: boolean;
    mode: 'mine' | 'admin';
    initialMatchId: number | null;
    initialLocationId: number | null;
    matches: Match[];
    fans: Fan[];
    canLoadAvailability: boolean;
    onHide: () => void;
    onSubmit: (values: TicketFormValues) => Promise<FormActionResult>;
}

export default function TicketPurchaseDialog({
    visible,
    mode,
    initialMatchId,
    initialLocationId,
    matches,
    fans,
    canLoadAvailability,
    onHide,
    onSubmit
}: TicketPurchaseDialogProps) {
    const requireFan = mode === 'admin';

    const [values, setValues] = useState<TicketFormValues>(createEmptyTicketForm());
    const [availability, setAvailability] = useState<MatchTicketAvailability | null>(null);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const purchasableMatches = useMemo(() => matches.filter((match) => canPurchaseTicketForMatch(match.status)), [matches]);

    useEffect(() => {
        if (!visible) return;
        const defaultMatchId = initialMatchId ?? purchasableMatches[0]?.id ?? null;
        setValues(createEmptyTicketForm(defaultMatchId, initialLocationId));
        setAvailability(null);
        setAvailabilityError(null);
        setSubmitted(false);
        setServerError(null);
    }, [visible, initialMatchId, initialLocationId, purchasableMatches]);

    useEffect(() => {
        if (!visible || !canLoadAvailability || values.matchId === null) {
            setAvailability(null);
            setLoadingAvailability(false);
            return;
        }
        const controller = new AbortController();
        setLoadingAvailability(true);
        setAvailabilityError(null);

        getMatchTicketAvailability(values.matchId, controller.signal)
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
    }, [visible, canLoadAvailability, values.matchId]);

    const matchOptions = useMemo(
        () =>
            purchasableMatches.map((match) => ({
                label: `${match.homeTeam.name} vs ${match.awayTeam.name} · ${match.venue.name} · ${formatDateTime(match.scheduledAt)}`,
                value: match.id
            })),
        [purchasableMatches]
    );

    const fanOptions = useMemo(
        () =>
            fans.map((fan) => ({
                label: `${fan.fullName} · ${fan.documentNumber}`,
                value: fan.id
            })),
        [fans]
    );

    const locationOptions = useMemo(() => {
        if (!availability) return [];
        return availability.locations.map((loc) => ({
            label: !loc.active
                ? `${loc.locationName} (Inactiva)`
                : loc.soldOut || loc.available <= 0
                  ? `${loc.locationName} (Agotada · 0/${loc.capacity})`
                  : `${loc.locationName} (${loc.available} cupos disponibles de ${loc.capacity})`,
            value: loc.locationId,
            disabled: !loc.active || loc.soldOut || loc.available <= 0
        }));
    }, [availability]);

    const errors = validateTicketForm(values, requireFan, availability);
    const fieldError = (field: keyof TicketFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof TicketFormValues) => (fieldError(field) ? 'p-invalid' : undefined);

    const handleMatchChange = (nextMatchId: number | null) => {
        setValues((current) => ({ ...current, matchId: nextMatchId, locationId: null }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        else setServerError(result.error ?? 'No se pudo emitir el boleto');
    };

    return (
        <Dialog
            header={mode === 'admin' ? 'Emitir boleto administrativo' : 'Comprar boleto'}
            visible={visible}
            onHide={onHide}
            className="w-full md:w-8 lg:w-6 xl:w-5"
            breakpoints={{ '640px': '95vw' }}
            modal
        >
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                {!canLoadAvailability && (
                    <Message
                        severity="warn"
                        text="No tienes permiso para consultar /tickets/availability; no es posible listar las localidades disponibles del partido."
                        className="w-full mb-3"
                    />
                )}

                {requireFan && (
                    <div className="field">
                        <label htmlFor="ticket-fan">Aficionado</label>
                        <Dropdown
                            inputId="ticket-fan"
                            value={values.fanId}
                            options={fanOptions}
                            onChange={(event) => setValues((current) => ({ ...current, fanId: (event.value as number | null) ?? null }))}
                            placeholder="Selecciona un aficionado activo"
                            emptyMessage="No hay aficionados activos disponibles"
                            filter={fanOptions.length > 6}
                            className={invalidClass('fanId')}
                        />
                        {fieldError('fanId') && <small className="p-error">{fieldError('fanId')}</small>}
                    </div>
                )}

                <div className="field">
                    <label htmlFor="ticket-match">Partido programado</label>
                    <Dropdown
                        inputId="ticket-match"
                        value={values.matchId}
                        options={matchOptions}
                        onChange={(event) => handleMatchChange((event.value as number | null) ?? null)}
                        placeholder="Selecciona un partido"
                        emptyMessage="No hay partidos programados disponibles"
                        filter={matchOptions.length > 6}
                        className={invalidClass('matchId')}
                    />
                    {fieldError('matchId') && <small className="p-error">{fieldError('matchId')}</small>}
                </div>

                {availabilityError && <Message severity="error" text={availabilityError} className="w-full mb-3" />}

                {availability && (
                    <Message
                        severity="info"
                        text={`Escenario: ${availability.venueName} · Cupos totales disponibles: ${availability.totalAvailable} de ${availability.totalCapacity}`}
                        className="w-full mb-3"
                    />
                )}

                <div className="field">
                    <label htmlFor="ticket-location">Localidad del escenario</label>
                    {loadingAvailability ? (
                        <Skeleton height="2.75rem" />
                    ) : (
                        <Dropdown
                            inputId="ticket-location"
                            value={values.locationId}
                            options={locationOptions}
                            optionDisabled="disabled"
                            onChange={(event) => setValues((current) => ({ ...current, locationId: (event.value as number | null) ?? null }))}
                            placeholder={values.matchId ? 'Selecciona una localidad con cupos' : 'Primero selecciona un partido'}
                            emptyMessage="El escenario no tiene localidades activas"
                            disabled={!canLoadAvailability || values.matchId === null}
                            className={invalidClass('locationId')}
                        />
                    )}
                    {fieldError('locationId') && <small className="p-error">{fieldError('locationId')}</small>}
                </div>

                <div className="field">
                    <label htmlFor="ticket-price">Precio del boleto (opcional, COP)</label>
                    <InputNumber
                        inputId="ticket-price"
                        value={values.price}
                        onValueChange={(event) => setValues((current) => ({ ...current, price: event.value ?? null }))}
                        mode="currency"
                        currency="COP"
                        locale="es-CO"
                        min={0}
                        max={99999999.99}
                        maxFractionDigits={2}
                        placeholder="0 (cortesía si se deja vacío)"
                        className={invalidClass('price')}
                    />
                    {fieldError('price') ? (
                        <small className="p-error">{fieldError('price')}</small>
                    ) : (
                        <small className="text-600">Recuerda: según el modelo del torneo se emite máximo 1 boleto por aficionado y partido.</small>
                    )}
                </div>

                <div className="flex justify-content-end gap-2 mt-3">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button
                        type="submit"
                        label={mode === 'admin' ? 'Emitir boleto' : 'Confirmar compra'}
                        icon="pi pi-check"
                        className="w-auto"
                        loading={saving}
                        disabled={!canLoadAvailability || purchasableMatches.length === 0}
                    />
                </div>
            </form>
        </Dialog>
    );
}

