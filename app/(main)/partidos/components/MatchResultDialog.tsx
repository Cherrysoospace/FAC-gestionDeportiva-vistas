'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import { FormActionResult } from '@/lib/form-action';
import { toRecordMatchResultPayload, validateMatchResultForm } from '@/lib/goal-form';
import { Match, RecordMatchResultPayload } from '@/types/sports';

interface MatchResultDialogProps {
    visible: boolean;
    match: Match | null;
    onHide: () => void;
    onSubmit: (matchId: number, payload: RecordMatchResultPayload) => Promise<FormActionResult>;
}

// HU-GC-07: registra o corrige el marcador final (única vía que finaliza el partido).
export default function MatchResultDialog({ visible, match, onHide, onSubmit }: MatchResultDialogProps) {
    const [homeScore, setHomeScore] = useState<number | null>(0);
    const [awayScore, setAwayScore] = useState<number | null>(0);
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible || !match) return;
        setHomeScore(match.homeScore ?? 0);
        setAwayScore(match.awayScore ?? 0);
        setSubmitted(false);
        setServerError(null);
    }, [visible, match]);

    if (!match) return null;

    const errors = validateMatchResultForm(homeScore, awayScore);
    const homeError = submitted ? errors.homeScore : undefined;
    const awayError = submitted ? errors.awayScore : undefined;
    const isAlreadyFinished = match.status === 'FINISHED';

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(match.id, toRecordMatchResultPayload(homeScore, awayScore));
        setSaving(false);

        if (result.ok) onHide();
        else setServerError(result.error ?? 'No se pudo guardar el resultado final');
    };

    return (
        <Dialog
            header={isAlreadyFinished ? 'Corregir resultado final' : 'Registrar resultado final'}
            visible={visible}
            onHide={onHide}
            className="w-full md:w-8 lg:w-5 xl:w-4"
            breakpoints={{ '640px': '95vw' }}
            modal
        >
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                <p className="text-700 mt-0 mb-3">
                    {match.phase.tournament.name} · {match.phase.label}
                </p>

                <Message
                    severity={isAlreadyFinished ? 'info' : 'warn'}
                    text={
                        isAlreadyFinished
                            ? 'El partido ya está finalizado: al guardar se actualizará el marcador mientras el torneo no esté cerrado (las apuestas ya liquidadas no se duplican).'
                            : 'Al guardar el resultado, el partido pasará a estado Finalizado, se cerrarán y liquidarán automáticamente sus apuestas pendientes y se enviará notificación a los aficionados.'
                    }
                    className="w-full mb-3"
                />

                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                <div className="formgrid grid">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="result-home-score">{match.homeTeam.name} (Local)</label>
                        <InputNumber
                            inputId="result-home-score"
                            value={homeScore}
                            onValueChange={(event) => setHomeScore(event.value ?? null)}
                            min={0}
                            showButtons
                            useGrouping={false}
                            className={homeError ? 'p-invalid' : undefined}
                        />
                        {homeError && <small className="p-error">{homeError}</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="result-away-score">{match.awayTeam.name} (Visitante)</label>
                        <InputNumber
                            inputId="result-away-score"
                            value={awayScore}
                            onValueChange={(event) => setAwayScore(event.value ?? null)}
                            min={0}
                            showButtons
                            useGrouping={false}
                            className={awayError ? 'p-invalid' : undefined}
                        />
                        {awayError && <small className="p-error">{awayError}</small>}
                    </div>
                </div>

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button
                        type="submit"
                        label={isAlreadyFinished ? 'Actualizar marcador' : 'Finalizar partido'}
                        icon="pi pi-check"
                        className="w-auto"
                        loading={saving}
                    />
                </div>
            </form>
        </Dialog>
    );
}
