'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { FormActionResult } from '@/lib/form-action';
import { TEAM_MODALITY_OPTIONS } from '@/lib/team-labels';
import { TeamFormValues, toTeamFormValues, validateTeamForm } from '@/lib/team-form';
import { Team, TeamModality } from '@/types/sports';

interface TeamFormDialogProps {
    visible: boolean;
    /** null = crear un equipo nuevo */
    team: Team | null;
    onHide: () => void;
    onSubmit: (values: TeamFormValues) => Promise<FormActionResult>;
}

export default function TeamFormDialog({ visible, team, onHide, onSubmit }: TeamFormDialogProps) {
    const editing = team !== null;
    // Misma regla que TeamsService: la modalidad no cambia si el equipo tiene inscripciones activas
    const modalityLocked = (team?.activeRegistrationsCount ?? 0) > 0;

    const [values, setValues] = useState<TeamFormValues>(toTeamFormValues(null));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // Cada vez que se abre, parte de los datos del equipo (o vacío al crear)
    useEffect(() => {
        if (!visible) return;
        setValues(toTeamFormValues(team));
        setSubmitted(false);
        setServerError(null);
    }, [visible, team]);

    const errors = validateTeamForm(values);
    const fieldError = (field: keyof TeamFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof TeamFormValues) => (fieldError(field) ? 'p-invalid' : undefined);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        // Errores por campo del backend: se muestran aquí. Los demás (409...) los muestra la página en un Toast.
        else if (result.validation) setServerError(result.error ?? 'Revisa los datos del equipo');
    };

    return (
        <Dialog header={editing ? 'Editar equipo' : 'Nuevo equipo'} visible={visible} onHide={onHide} className="w-full md:w-8 lg:w-6 xl:w-4" breakpoints={{ '640px': '95vw' }} modal>
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                <div className="field">
                    <label htmlFor="team-name">Nombre del equipo</label>
                    <InputText id="team-name" value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} className={invalidClass('name')} autoFocus />
                    {fieldError('name') && <small className="p-error">{fieldError('name')}</small>}
                </div>

                <div className="field">
                    <label htmlFor="team-city">Ciudad</label>
                    <InputText id="team-city" value={values.city} onChange={(event) => setValues((current) => ({ ...current, city: event.target.value }))} className={invalidClass('city')} />
                    {fieldError('city') && <small className="p-error">{fieldError('city')}</small>}
                </div>

                <div className="field">
                    <label htmlFor="team-modality">Modalidad</label>
                    <Dropdown
                        inputId="team-modality"
                        value={values.modality}
                        options={TEAM_MODALITY_OPTIONS}
                        onChange={(event) => setValues((current) => ({ ...current, modality: (event.value as TeamModality | null) ?? null }))}
                        placeholder="Selecciona la modalidad"
                        className={invalidClass('modality')}
                        disabled={modalityLocked}
                    />
                    {fieldError('modality') && <small className="p-error">{fieldError('modality')}</small>}
                    {modalityLocked && <small className="text-600">La modalidad no se puede cambiar mientras el equipo tenga inscripciones activas.</small>}
                </div>

                {editing && (
                    <div className="field flex align-items-center gap-2">
                        <InputSwitch inputId="team-active" checked={values.active} onChange={(event) => setValues((current) => ({ ...current, active: Boolean(event.value) }))} />
                        <label htmlFor="team-active" className="m-0">
                            {values.active ? 'Activo' : 'Inactivo'}
                        </label>
                    </div>
                )}

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={editing ? 'Guardar cambios' : 'Crear equipo'} icon="pi pi-check" className="w-auto" loading={saving} />
                </div>
            </form>
        </Dialog>
    );
}
