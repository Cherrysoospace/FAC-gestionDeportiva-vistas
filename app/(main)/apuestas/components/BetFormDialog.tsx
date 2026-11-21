'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import {
    BET_SELECTION_OPTIONS,
    BetFormValues,
    calculatePotentialPayout,
    createEmptyBetForm,
    toBetFormValues,
    validateBetForm
} from '@/lib/bet-form';
import { FormActionResult } from '@/lib/form-action';
import { formatCurrencyCop } from '@/lib/ticket-form';
import { formatDateTime } from '@/lib/tournament-labels';
import { Bet, BetSelection, Fan, FanPaymentMethod, Match } from '@/types/sports';

interface BetFormDialogProps {
    visible: boolean;
    mode: 'mine' | 'admin';
    bet: Bet | null;
    initialMatchId: number | null;
    availableMatches: Match[];
    myPaymentMethods: FanPaymentMethod[];
    fans: Fan[];
    onHide: () => void;
    onSubmit: (values: BetFormValues) => Promise<FormActionResult>;
}

export default function BetFormDialog({
    visible,
    mode,
    bet,
    initialMatchId,
    availableMatches,
    myPaymentMethods,
    fans,
    onHide,
    onSubmit
}: BetFormDialogProps) {
    const editing = bet !== null;
    const requireFan = mode === 'admin' && !editing;

    const [values, setValues] = useState<BetFormValues>(createEmptyBetForm());
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        if (bet) {
            setValues(toBetFormValues(bet));
        } else {
            const defaultMatchId = initialMatchId ?? availableMatches[0]?.id ?? null;
            const defaultPaymentId = mode === 'mine' ? myPaymentMethods[0]?.id ?? null : null;
            setValues(createEmptyBetForm(defaultMatchId, defaultPaymentId));
        }
        setSubmitted(false);
        setServerError(null);
    }, [visible, bet, initialMatchId, availableMatches, myPaymentMethods, mode]);

    const matchOptions = useMemo(
        () =>
            availableMatches.map((match) => ({
                label: `${match.homeTeam.name} vs ${match.awayTeam.name} · ${match.phase.tournament.name} · ${formatDateTime(match.scheduledAt)}`,
                value: match.id
            })),
        [availableMatches]
    );

    const fanOptions = useMemo(
        () =>
            fans.map((fan) => ({
                label: `${fan.fullName} · ${fan.documentNumber}`,
                value: fan.id
            })),
        [fans]
    );

    const paymentMethodOptions = useMemo(() => {
        const list = myPaymentMethods.map((method) => ({
            label: `${method.alias} · ${method.paymentMethod.name} (${method.reference})`,
            value: method.id
        }));

        if (bet && !list.some((opt) => opt.value === bet.paymentMethod.id)) {
            list.unshift({
                label: `${bet.paymentMethod.alias} · ${bet.paymentMethod.paymentMethodName} (${bet.paymentMethod.reference})`,
                value: bet.paymentMethod.id
            });
        }
        return list;
    }, [myPaymentMethods, bet]);

    const selectedMatch = useMemo(() => {
        if (bet) return null;
        return availableMatches.find((item) => item.id === values.matchId) ?? null;
    }, [bet, availableMatches, values.matchId]);

    const errors = validateBetForm(values, { editing, requireFan });
    const fieldError = (field: keyof BetFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof BetFormValues) => (fieldError(field) ? 'p-invalid' : undefined);

    const potentialPayout = calculatePotentialPayout(values.amount, values.odds);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        else setServerError(result.error ?? 'No se pudo registrar la apuesta');
    };

    const title = editing
        ? 'Editar apuesta pendiente'
        : mode === 'admin'
          ? 'Registrar apuesta administrativa'
          : 'Nueva apuesta';

    return (
        <Dialog
            header={title}
            visible={visible}
            onHide={onHide}
            className="w-full md:w-8 lg:w-6 xl:w-5"
            breakpoints={{ '640px': '95vw' }}
            modal
        >
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                {editing && bet && (
                    <Message
                        severity="info"
                        text={`${bet.match.homeTeamName} vs ${bet.match.awayTeamName} · Cuota fija pactada: ${bet.odds.toFixed(2)}x (inmutable).`}
                        className="w-full mb-3"
                    />
                )}

                {!editing && mode === 'mine' && myPaymentMethods.length === 0 && (
                    <Message
                        severity="warn"
                        text="No tienes métodos de pago activos registrados. Registra uno en Métodos de pago antes de apostar."
                        className="w-full mb-3"
                    />
                )}

                <div className="formgrid grid">
                    {requireFan && (
                        <div className="field col-12">
                            <label htmlFor="bet-fan">Aficionado</label>
                            <Dropdown
                                inputId="bet-fan"
                                value={values.fanId}
                                options={fanOptions}
                                onChange={(event) => setValues((current) => ({ ...current, fanId: (event.value as number | null) ?? null }))}
                                placeholder="Selecciona un aficionado activo"
                                emptyMessage="No hay aficionados activos"
                                filter={fanOptions.length > 6}
                                className={invalidClass('fanId')}
                            />
                            {fieldError('fanId') && <small className="p-error">{fieldError('fanId')}</small>}
                        </div>
                    )}

                    {!editing && (
                        <div className="field col-12">
                            <label htmlFor="bet-match">Partido disponible</label>
                            <Dropdown
                                inputId="bet-match"
                                value={values.matchId}
                                options={matchOptions}
                                onChange={(event) => setValues((current) => ({ ...current, matchId: (event.value as number | null) ?? null }))}
                                placeholder="Selecciona un partido programado"
                                emptyMessage="No hay partidos disponibles para apostar"
                                filter={matchOptions.length > 6}
                                className={invalidClass('matchId')}
                            />
                            {fieldError('matchId') && <small className="p-error">{fieldError('matchId')}</small>}
                            {selectedMatch && (
                                <small className="text-600">
                                    Escenario: {selectedMatch.venue.name} · Máximo 1 apuesta por partido y aficionado.
                                </small>
                            )}
                        </div>
                    )}

                    {mode === 'mine' ? (
                        <div className="field col-12">
                            <label htmlFor="bet-payment-method">Método de pago propio</label>
                            <Dropdown
                                inputId="bet-payment-method"
                                value={values.fanPaymentMethodId}
                                options={paymentMethodOptions}
                                onChange={(event) =>
                                    setValues((current) => ({ ...current, fanPaymentMethodId: (event.value as number | null) ?? null }))
                                }
                                placeholder="Selecciona un método de pago activo"
                                emptyMessage="No tienes métodos de pago activos"
                                className={invalidClass('fanPaymentMethodId')}
                            />
                            {fieldError('fanPaymentMethodId') && <small className="p-error">{fieldError('fanPaymentMethodId')}</small>}
                        </div>
                    ) : (
                        <div className="field col-12">
                            <label htmlFor="bet-admin-pm-id">ID del método de pago del aficionado</label>
                            <InputNumber
                                inputId="bet-admin-pm-id"
                                value={values.fanPaymentMethodId}
                                onValueChange={(event) => setValues((current) => ({ ...current, fanPaymentMethodId: event.value ?? null }))}
                                min={1}
                                useGrouping={false}
                                placeholder="Ej. 3"
                                className={invalidClass('fanPaymentMethodId')}
                            />
                            {fieldError('fanPaymentMethodId') ? (
                                <small className="p-error">{fieldError('fanPaymentMethodId')}</small>
                            ) : (
                                <small className="text-600">
                                    Debe corresponder a un método de pago activo perteneciente al aficionado seleccionado.
                                </small>
                            )}
                        </div>
                    )}

                    <div className="field col-12 md:col-6">
                        <label htmlFor="bet-selection">Pronóstico</label>
                        <Dropdown
                            inputId="bet-selection"
                            value={values.selection}
                            options={BET_SELECTION_OPTIONS}
                            onChange={(event) =>
                                setValues((current) => ({ ...current, selection: (event.value as BetSelection | null) ?? null }))
                            }
                            className={invalidClass('selection')}
                        />
                        {fieldError('selection') && <small className="p-error">{fieldError('selection')}</small>}
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="bet-odds">Cuota fija (x)</label>
                        <InputNumber
                            inputId="bet-odds"
                            value={values.odds}
                            onValueChange={(event) => setValues((current) => ({ ...current, odds: event.value ?? null }))}
                            min={1.01}
                            max={100}
                            minFractionDigits={2}
                            maxFractionDigits={2}
                            disabled={editing}
                            className={invalidClass('odds')}
                        />
                        {fieldError('odds') ? (
                            <small className="p-error">{fieldError('odds')}</small>
                        ) : (
                            <small className="text-600">
                                {editing ? 'La cuota queda fija al crear la apuesta.' : 'Cuota inmutable entre 1.01 y 100.00.'}
                            </small>
                        )}
                    </div>

                    <div className="field col-12">
                        <label htmlFor="bet-amount">Monto a apostar (COP)</label>
                        <InputNumber
                            inputId="bet-amount"
                            value={values.amount}
                            onValueChange={(event) => setValues((current) => ({ ...current, amount: event.value ?? null }))}
                            mode="currency"
                            currency="COP"
                            locale="es-CO"
                            min={1}
                            max={100000000}
                            maxFractionDigits={2}
                            placeholder="Ej. 50000"
                            className={invalidClass('amount')}
                        />
                        {fieldError('amount') && <small className="p-error">{fieldError('amount')}</small>}
                    </div>
                </div>

                <div className="surface-ground border-round p-3 flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                    <span className="text-700 font-medium">Ganancia potencial estimada</span>
                    <span className="text-xl font-bold text-primary">{formatCurrencyCop(potentialPayout)}</span>
                </div>

                <div className="flex justify-content-end gap-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button
                        type="submit"
                        label={editing ? 'Guardar cambios' : 'Confirmar apuesta'}
                        icon="pi pi-check"
                        className="w-auto"
                        loading={saving}
                        disabled={!editing && (availableMatches.length === 0 || (mode === 'mine' && myPaymentMethods.length === 0))}
                    />
                </div>
            </form>
        </Dialog>
    );
}

