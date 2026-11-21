'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { BET_SELECTION_LABELS, validateCancelBetReason } from '@/lib/bet-form';
import { FormActionResult } from '@/lib/form-action';
import { formatCurrencyCop } from '@/lib/ticket-form';
import { Bet } from '@/types/sports';

interface BetCancelDialogProps {
    visible: boolean;
    mode: 'cancel-mine' | 'void-admin';
    bet: Bet | null;
    onHide: () => void;
    onSubmit: (betId: number, reason: string) => Promise<FormActionResult>;
}

export default function BetCancelDialog({ visible, mode, bet, onHide, onSubmit }: BetCancelDialogProps) {
    const [reason, setReason] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        setReason('');
        setSubmitted(false);
        setServerError(null);
    }, [visible, bet]);

    const reasonError = submitted ? validateCancelBetReason(reason) : null;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!bet) return;
        setSubmitted(true);
        setServerError(null);
        if (validateCancelBetReason(reason)) return;

        setSaving(true);
        const result = await onSubmit(bet.id, reason);
        setSaving(false);

        if (result.ok) onHide();
        else setServerError(result.error ?? 'No se pudo procesar la operación');
    };

    const isAdminVoid = mode === 'void-admin';

    return (
        <Dialog
            header={isAdminVoid ? 'Anular apuesta pendiente' : 'Cancelar mi apuesta'}
            visible={visible}
            onHide={onHide}
            className="w-full md:w-7 lg:w-5 xl:w-4"
            breakpoints={{ '640px': '95vw' }}
            modal
        >
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                {bet && (
                    <Message
                        severity="warn"
                        text={`${bet.match.homeTeamName} vs ${bet.match.awayTeamName} · ${BET_SELECTION_LABELS[bet.selection]} · Se devolverá el valor apostado (${formatCurrencyCop(bet.amount)}).`}
                        className="w-full mb-3"
                    />
                )}

                <div className="field">
                    <label htmlFor="bet-cancel-reason">Motivo (opcional)</label>
                    <InputTextarea
                        id="bet-cancel-reason"
                        rows={3}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder={
                            isAdminVoid
                                ? 'Ej. Anulación administrativa por inconsistencia de programación'
                                : 'Ej. Decidí no continuar con esta apuesta'
                        }
                        className={reasonError ? 'p-invalid' : undefined}
                        autoFocus
                    />
                    {reasonError && <small className="p-error">{reasonError}</small>}
                </div>

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Volver" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button
                        type="submit"
                        label={isAdminVoid ? 'Confirmar anulación' : 'Cancelar apuesta'}
                        icon="pi pi-ban"
                        severity="danger"
                        className="w-auto"
                        loading={saving}
                    />
                </div>
            </form>
        </Dialog>
    );
}

