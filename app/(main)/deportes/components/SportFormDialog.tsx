'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { FormActionResult } from '@/lib/form-action';
import { SportFormValues, toSportFormValues, validateSportForm } from '@/lib/sport-form';
import { Sport } from '@/types/sports';

interface SportFormDialogProps {
    visible: boolean;
    /** null = crear un deporte nuevo */
    sport: Sport | null;
    /** Deportes disponibles como padre (el propio deporte se excluye aquí) */
    sports: Sport[];
    onHide: () => void;
    onSubmit: (values: SportFormValues) => Promise<FormActionResult>;
}

export default function SportFormDialog({ visible, sport, sports, onHide, onSubmit }: SportFormDialogProps) {
    const editing = sport !== null;
    const [values, setValues] = useState<SportFormValues>(toSportFormValues(null));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        setValues(toSportFormValues(sport));
        setSubmitted(false);
        setServerError(null);
    }, [visible, sport]);

    const parentOptions = sports.filter((item) => item.id !== sport?.id && (item.active || item.id === sport?.parent?.id)).map((item) => ({ label: item.name, value: item.id }));

    const errors = validateSportForm(values);
    const fieldError = (field: keyof SportFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof SportFormValues) => (fieldError(field) ? 'p-invalid' : undefined);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        // 400 por campo se muestra aquí; el resto (409 nombre repetido, ciclo de padre...) lo muestra la página en un Toast
        else if (result.validation) setServerError(result.error ?? 'Revisa los datos del deporte');
    };

    return (
        <Dialog header={editing ? 'Editar deporte' : 'Nuevo deporte'} visible={visible} onHide={onHide} className="w-full md:w-8 lg:w-6 xl:w-4" breakpoints={{ '640px': '95vw' }} modal>
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                <div className="field">
                    <label htmlFor="sport-name">Nombre</label>
                    <InputText id="sport-name" value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} className={invalidClass('name')} autoFocus />
                    {fieldError('name') && <small className="p-error">{fieldError('name')}</small>}
                </div>

                <div className="field">
                    <label htmlFor="sport-description">Descripción (opcional)</label>
                    <InputTextarea id="sport-description" rows={3} value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} className={invalidClass('description')} />
                    {fieldError('description') && <small className="p-error">{fieldError('description')}</small>}
                </div>

                <div className="field">
                    <label htmlFor="sport-parent">Deporte padre (opcional)</label>
                    <Dropdown
                        inputId="sport-parent"
                        value={values.parentId}
                        options={parentOptions}
                        onChange={(event) => setValues((current) => ({ ...current, parentId: (event.value as number | null) ?? null }))}
                        placeholder="Sin padre (deporte raíz)"
                        showClear
                        filter
                    />
                    <small className="text-600">Un subdeporte (ej. Fútbol sala) depende de un deporte raíz.</small>
                </div>

                {editing && (
                    <div className="field flex align-items-center gap-2">
                        <InputSwitch inputId="sport-active" checked={values.active} onChange={(event) => setValues((current) => ({ ...current, active: Boolean(event.value) }))} />
                        <label htmlFor="sport-active" className="m-0">
                            {values.active ? 'Activo' : 'Inactivo'}
                        </label>
                    </div>
                )}

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={editing ? 'Guardar cambios' : 'Crear deporte'} icon="pi pi-check" className="w-auto" loading={saving} />
                </div>
            </form>
        </Dialog>
    );
}

