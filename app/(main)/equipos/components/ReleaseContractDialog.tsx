'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { parseIsoDate } from '@/lib/dates';
import { ReleaseFormValues, validateReleaseForm } from '@/lib/contract-form';
import { FormActionResult } from '@/lib/form-action';
import { RELEASE_REASON_OPTIONS } from '@/lib/player-labels';
import { ReleaseReason, TeamPlayer } from '@/types/sports';

interface ReleaseContractDialogProps {
    visible: boolean;
    teamName: string;
    contract: TeamPlayer | null;
    onHide: () => void;
    onSubmit: (values: ReleaseFormValues) => Promise<FormActionResult>;
}

// Retira al jugador de la plantilla: el contrato queda en el historial de traspasos (no se borra).
export default function ReleaseContractDialog({ visible, teamName, contract, onHide, onSubmit }: ReleaseContractDialogProps) {
    const [values, setValues] = useState<ReleaseFormValues>({ reason: null, releaseDate: null });
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        setValues({ reason: null, releaseDate: null });
        setSubmitted(false);
        setServerError(null);
    }, [visible]);

    if (!contract) return null;

    const errors = validateReleaseForm(values, contract);
    const fieldError = (field: keyof ReleaseFormValues) => (submitted ? errors[field] : undefined);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        else setServerError(result.error ?? 'No se pudo retirar al jugador');
    };

    const today = new Date();
    const maxDate = parseIsoDate(contract.endDate);

    return (
        <Dialog header={`Retirar a ${contract.player.fullName}`} visible={visible} onHide={onHide} className="w-full md:w-8 lg:w-6 xl:w-4" breakpoints={{ '640px': '95vw' }} modal>
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                <Message severity="warn" text={`${contract.player.fullName} dejará de pertenecer a la plantilla actual de ${teamName}, pero su vinculación quedará registrada en el historial.`} className="w-full mb-3" />
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                <div className="field">
                    <label htmlFor="release-reason">Motivo</label>
                    <Dropdown
                        inputId="release-reason"
                        value={values.reason}
                        options={RELEASE_REASON_OPTIONS}
                        onChange={(event) => setValues((current) => ({ ...current, reason: (event.value as ReleaseReason | null) ?? null }))}
                        placeholder="Selecciona el motivo"
                        className={fieldError('reason') ? 'p-invalid' : undefined}
                    />
                    {fieldError('reason') && <small className="p-error">{fieldError('reason')}</small>}
                </div>

                <div className="field">
                    <label htmlFor="release-date">Fecha de retiro (opcional)</label>
                    <Calendar
                        inputId="release-date"
                        value={values.releaseDate}
                        onChange={(event) => setValues((current) => ({ ...current, releaseDate: event.value instanceof Date ? event.value : null }))}
                        dateFormat="dd/mm/yy"
                        placeholder="Hoy"
                        minDate={parseIsoDate(contract.startDate) ?? undefined}
                        maxDate={maxDate && maxDate < today ? maxDate : today}
                        showIcon
                        showButtonBar
                        className={fieldError('releaseDate') ? 'p-invalid' : undefined}
                    />
                    {fieldError('releaseDate') ? <small className="p-error">{fieldError('releaseDate')}</small> : <small className="text-600">Si la dejas vacía se usa la fecha de hoy (o el fin del contrato si ya venció).</small>}
                </div>

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label="Retirar de la plantilla" icon="pi pi-sign-out" severity="danger" className="w-auto" loading={saving} />
                </div>
            </form>
        </Dialog>
    );
}
