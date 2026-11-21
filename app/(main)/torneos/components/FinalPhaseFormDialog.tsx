'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { FormActionResult } from '@/lib/form-action';
import { FINAL_ROUND_OPTIONS } from '@/lib/phase-labels';
import { FinalPhaseFormValues, toFinalPhaseFormValues, validateFinalPhaseForm } from '@/lib/phase-form';
import { FinalPhase, FinalRound, Tournament } from '@/types/sports';
import PhaseCommonFields from './PhaseCommonFields';

interface FinalPhaseFormDialogProps {
    visible: boolean;
    /** null = crear una fase final nueva */
    phase: FinalPhase | null;
    tournament: Tournament;
    onHide: () => void;
    onSubmit: (values: FinalPhaseFormValues) => Promise<FormActionResult>;
}

export default function FinalPhaseFormDialog({ visible, phase, tournament, onHide, onSubmit }: FinalPhaseFormDialogProps) {
    const editing = phase !== null;
    const [values, setValues] = useState<FinalPhaseFormValues>(toFinalPhaseFormValues(null));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        setValues(toFinalPhaseFormValues(phase));
        setSubmitted(false);
        setServerError(null);
    }, [visible, phase]);

    const errors = validateFinalPhaseForm(values, tournament);
    const shownErrors = submitted ? errors : {};

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        // 400 por campo se muestra aquí; el resto (409, reglas de negocio, 503...) lo muestra la página en un Toast
        else if (result.validation) setServerError(result.error ?? 'Revisa los datos de la fase final');
    };

    return (
        <Dialog header={editing ? 'Editar fase final' : 'Nueva fase final'} visible={visible} onHide={onHide} className="w-full md:w-8 lg:w-6 xl:w-5" breakpoints={{ '640px': '95vw' }} modal>
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                <PhaseCommonFields idPrefix="final-phase" values={values} errors={shownErrors} range={tournament} onChange={(patch) => setValues((current) => ({ ...current, ...patch }))} />

                <div className="field">
                    <label htmlFor="final-phase-round">Ronda</label>
                    <Dropdown
                        inputId="final-phase-round"
                        value={values.round}
                        options={FINAL_ROUND_OPTIONS}
                        onChange={(event) => setValues((current) => ({ ...current, round: (event.value as FinalRound | null) ?? null }))}
                        placeholder="Selecciona la ronda"
                        className={shownErrors.round ? 'p-invalid' : undefined}
                    />
                    {shownErrors.round && <small className="p-error">{shownErrors.round}</small>}
                </div>

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={editing ? 'Guardar cambios' : 'Crear fase final'} icon="pi pi-check" className="w-auto" loading={saving} />
                </div>
            </form>
        </Dialog>
    );
}
