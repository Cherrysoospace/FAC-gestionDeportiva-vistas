'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { FormActionResult } from '@/lib/form-action';
import { GroupPhaseFormValues, toGroupPhaseFormValues, validateGroupPhaseForm } from '@/lib/phase-form';
import { GroupPhase, Tournament } from '@/types/sports';
import PhaseCommonFields from './PhaseCommonFields';

interface GroupPhaseFormDialogProps {
    visible: boolean;
    /** null = crear un grupo nuevo */
    phase: GroupPhase | null;
    tournament: Tournament;
    onHide: () => void;
    onSubmit: (values: GroupPhaseFormValues) => Promise<FormActionResult>;
}

export default function GroupPhaseFormDialog({ visible, phase, tournament, onHide, onSubmit }: GroupPhaseFormDialogProps) {
    const editing = phase !== null;
    const [values, setValues] = useState<GroupPhaseFormValues>(toGroupPhaseFormValues(null));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        setValues(toGroupPhaseFormValues(phase));
        setSubmitted(false);
        setServerError(null);
    }, [visible, phase]);

    const errors = validateGroupPhaseForm(values, tournament);
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
        else if (result.validation) setServerError(result.error ?? 'Revisa los datos del grupo');
    };

    return (
        <Dialog header={editing ? 'Editar grupo' : 'Nuevo grupo'} visible={visible} onHide={onHide} className="w-full md:w-8 lg:w-6 xl:w-5" breakpoints={{ '640px': '95vw' }} modal>
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                <PhaseCommonFields idPrefix="group-phase" values={values} errors={shownErrors} range={tournament} onChange={(patch) => setValues((current) => ({ ...current, ...patch }))} />

                <div className="formgrid grid">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="group-phase-group-name">Nombre del grupo</label>
                        <InputText id="group-phase-group-name" value={values.groupName} onChange={(event) => setValues((current) => ({ ...current, groupName: event.target.value }))} className={shownErrors.groupName ? 'p-invalid' : undefined} placeholder="Ej. A" />
                        {shownErrors.groupName && <small className="p-error">{shownErrors.groupName}</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="group-phase-qualifiers">Clasificados (opcional)</label>
                        <InputNumber inputId="group-phase-qualifiers" value={values.qualifiersCount} onValueChange={(event) => setValues((current) => ({ ...current, qualifiersCount: event.value ?? null }))} min={1} useGrouping={false} showButtons className={shownErrors.qualifiersCount ? 'p-invalid' : undefined} />
                        {shownErrors.qualifiersCount && <small className="p-error">{shownErrors.qualifiersCount}</small>}
                    </div>
                </div>

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={editing ? 'Guardar cambios' : 'Crear grupo'} icon="pi pi-check" className="w-auto" loading={saving} />
                </div>
            </form>
        </Dialog>
    );
}

