'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { FormActionResult } from '@/lib/form-action';
import { SKILL_CATEGORY_OPTIONS } from '@/lib/skill-constants';
import { SkillFormValues, toSkillFormValues, validateSkillForm } from '@/lib/skill-form';
import { Skill } from '@/types/sports';

interface SkillFormDialogProps {
    visible: boolean;
    /** null = crear una habilidad nueva */
    skill: Skill | null;
    onHide: () => void;
    onSubmit: (values: SkillFormValues) => Promise<FormActionResult>;
}

export default function SkillFormDialog({ visible, skill, onHide, onSubmit }: SkillFormDialogProps) {
    const editing = skill !== null;
    const [values, setValues] = useState<SkillFormValues>(toSkillFormValues(null));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        setValues(toSkillFormValues(skill));
        setSubmitted(false);
        setServerError(null);
    }, [visible, skill]);

    const errors = validateSkillForm(values);
    const fieldError = (field: keyof SkillFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof SkillFormValues) => (fieldError(field) ? 'p-invalid' : undefined);
    const setField = <K extends keyof SkillFormValues>(field: K, value: SkillFormValues[K]) => setValues((current) => ({ ...current, [field]: value }));

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        // 400 por campo se muestra aquí; el resto (409 nombre repetido, 503...) lo muestra la página en un Toast
        else if (result.validation) setServerError(result.error ?? 'Revisa los datos de la habilidad');
    };

    return (
        <Dialog header={editing ? 'Editar habilidad' : 'Nueva habilidad'} visible={visible} onHide={onHide} className="w-full md:w-8 lg:w-6 xl:w-4" breakpoints={{ '640px': '95vw' }} modal>
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                <div className="field">
                    <label htmlFor="skill-name">Nombre</label>
                    <InputText id="skill-name" value={values.name} onChange={(event) => setField('name', event.target.value)} className={invalidClass('name')} autoFocus />
                    {fieldError('name') && <small className="p-error">{fieldError('name')}</small>}
                </div>

                <div className="field">
                    <label htmlFor="skill-category">Categoría</label>
                    <Dropdown inputId="skill-category" value={values.category} options={SKILL_CATEGORY_OPTIONS} onChange={(event) => setField('category', (event.value as Skill['category'] | null) ?? null)} placeholder="Selecciona una categoría" className={invalidClass('category')} />
                    {fieldError('category') && <small className="p-error">{fieldError('category')}</small>}
                </div>

                <div className="field">
                    <label htmlFor="skill-description">Descripción</label>
                    <InputTextarea id="skill-description" rows={4} value={values.description} onChange={(event) => setField('description', event.target.value)} className={invalidClass('description')} />
                    {fieldError('description') && <small className="p-error">{fieldError('description')}</small>}
                </div>

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={editing ? 'Guardar cambios' : 'Crear habilidad'} icon="pi pi-check" className="w-auto" loading={saving} />
                </div>
            </form>
        </Dialog>
    );
}
