'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Slider } from 'primereact/slider';

// Mismo rango que CreatePlayerSkillDto en ms-sports
export const MIN_SKILL_LEVEL = 1;
export const MAX_SKILL_LEVEL = 100;

interface SkillLevelDialogProps {
    visible: boolean;
    /** Nombre de la habilidad que se asigna o edita */
    skillName: string;
    initialLevel: number;
    confirmLabel: string;
    onHide: () => void;
    onSubmit: (level: number) => Promise<boolean>;
}

// Pide el nivel (1 a 100) al asignar una habilidad o al cambiarlo.
export default function SkillLevelDialog({ visible, skillName, initialLevel, confirmLabel, onHide, onSubmit }: SkillLevelDialogProps) {
    const [level, setLevel] = useState(initialLevel);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (visible) setLevel(initialLevel);
    }, [visible, initialLevel]);

    const valid = Number.isInteger(level) && level >= MIN_SKILL_LEVEL && level <= MAX_SKILL_LEVEL;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!valid) return;
        setSaving(true);
        const ok = await onSubmit(level);
        setSaving(false);
        if (ok) onHide();
    };

    return (
        <Dialog header={`Nivel en ${skillName}`} visible={visible} onHide={onHide} className="w-full md:w-6 lg:w-4" breakpoints={{ '640px': '95vw' }} modal>
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                <div className="field">
                    <label htmlFor="skill-level">Nivel (1 a 100)</label>
                    <InputNumber inputId="skill-level" value={level} onValueChange={(event) => setLevel(event.value ?? MIN_SKILL_LEVEL)} min={MIN_SKILL_LEVEL} max={MAX_SKILL_LEVEL} autoFocus />
                    <Slider value={level} onChange={(event) => setLevel(Number(event.value))} min={MIN_SKILL_LEVEL} max={MAX_SKILL_LEVEL} className="mt-3" aria-label="Nivel" />
                    {!valid && <small className="p-error">El nivel debe ser un número entero entre 1 y 100</small>}
                </div>
                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={confirmLabel} icon="pi pi-check" className="w-auto" loading={saving} disabled={!valid} />
                </div>
            </form>
        </Dialog>
    );
}
