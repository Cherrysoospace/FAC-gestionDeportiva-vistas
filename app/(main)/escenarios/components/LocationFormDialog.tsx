'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { FormActionResult } from '@/lib/form-action';
import { LocationFormValues, MAX_LOCATION_CAPACITY, toLocationFormValues, validateLocationForm } from '@/lib/location-form';
import { Location } from '@/types/sports';

interface LocationFormDialogProps {
    visible: boolean;
    /** null = crear una localidad nueva */
    location: Location | null;
    venueName: string;
    onHide: () => void;
    onSubmit: (values: LocationFormValues) => Promise<FormActionResult>;
}

export default function LocationFormDialog({ visible, location, venueName, onHide, onSubmit }: LocationFormDialogProps) {
    const editing = location !== null;

    const [values, setValues] = useState<LocationFormValues>(toLocationFormValues(null));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        setValues(toLocationFormValues(location));
        setSubmitted(false);
        setServerError(null);
    }, [visible, location]);

    const errors = validateLocationForm(values);
    const fieldError = (field: keyof LocationFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof LocationFormValues) => (fieldError(field) ? 'p-invalid' : undefined);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        else if (result.validation) setServerError(result.error ?? 'Revisa los datos de la localidad');
    };

    return (
        <Dialog header={editing ? 'Editar localidad' : `Nueva localidad en ${venueName}`} visible={visible} onHide={onHide} className="w-full md:w-6 lg:w-4" breakpoints={{ '640px': '95vw' }} modal>
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                <div className="field">
                    <label htmlFor="location-name">Nombre</label>
                    <InputText id="location-name" value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} className={invalidClass('name')} placeholder="Ej. Norte, Sur, General, VIP" autoFocus />
                    {fieldError('name') && <small className="p-error">{fieldError('name')}</small>}
                </div>

                <div className="field">
                    <label htmlFor="location-capacity">Capacidad (personas)</label>
                    <InputNumber
                        inputId="location-capacity"
                        value={values.capacity}
                        onValueChange={(event) => setValues((current) => ({ ...current, capacity: event.value ?? null }))}
                        min={1}
                        max={MAX_LOCATION_CAPACITY}
                        useGrouping
                        locale="es-CO"
                        className={invalidClass('capacity')}
                    />
                    {fieldError('capacity') && <small className="p-error">{fieldError('capacity')}</small>}
                </div>

                {editing && (
                    <div className="field flex align-items-center gap-2">
                        <InputSwitch inputId="location-active" checked={values.active} onChange={(event) => setValues((current) => ({ ...current, active: Boolean(event.value) }))} />
                        <label htmlFor="location-active" className="m-0">
                            {values.active ? 'Activa' : 'Inactiva'}
                        </label>
                    </div>
                )}

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={editing ? 'Guardar cambios' : 'Crear localidad'} icon="pi pi-check" className="w-auto" loading={saving} />
                </div>
            </form>
        </Dialog>
    );
}
