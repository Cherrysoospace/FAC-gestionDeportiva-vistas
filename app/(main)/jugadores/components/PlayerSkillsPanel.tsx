'use client';

import { useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import EmptyState from '@/components/ui/EmptyState';
import SearchInput from '@/components/ui/SearchInput';
import { SKILL_CATEGORY_LABELS, SKILL_CATEGORY_SEVERITY } from '@/lib/player-labels';
import { PlayerSkill, Skill } from '@/types/sports';
import SkillLevelDialog from './SkillLevelDialog';

interface PlayerSkillsPanelProps {
    skills: PlayerSkill[];
    /** Catálogo para elegir (GET /skills) */
    catalog: Skill[];
    catalogError: string | null;
    canAssign: boolean;
    canChangeLevel: boolean;
    canRemove: boolean;
    onAssign: (skill: Skill, level: number) => Promise<boolean>;
    onChangeLevel: (playerSkill: PlayerSkill, level: number) => Promise<boolean>;
    onRemove: (playerSkill: PlayerSkill) => Promise<void>;
}

const DEFAULT_LEVEL = 70;

type LevelDialog = { kind: 'assign'; skill: Skill } | { kind: 'edit'; playerSkill: PlayerSkill } | null;

// HU-GD-07 (y la sección de habilidades de HU-GD-08): asignadas a la derecha, disponibles a la izquierda.
export default function PlayerSkillsPanel({ skills, catalog, catalogError, canAssign, canChangeLevel, canRemove, onAssign, onChangeLevel, onRemove }: PlayerSkillsPanelProps) {
    const [search, setSearch] = useState('');
    const [dialog, setDialog] = useState<LevelDialog>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);

    const assignedIds = useMemo(() => new Set(skills.map((playerSkill) => playerSkill.skill.id)), [skills]);
    const available = useMemo(() => {
        const term = search.trim().toLowerCase();
        return catalog.filter((skill) => !assignedIds.has(skill.id) && skill.name.toLowerCase().includes(term));
    }, [catalog, assignedIds, search]);

    const average = skills.length > 0 ? Math.round(skills.reduce((total, playerSkill) => total + playerSkill.level, 0) / skills.length) : null;

    const handleRemove = async (playerSkill: PlayerSkill) => {
        setRemovingId(playerSkill.id);
        await onRemove(playerSkill);
        setRemovingId(null);
    };

    const submitLevel = (level: number) => {
        if (dialog?.kind === 'assign') return onAssign(dialog.skill, level);
        if (dialog?.kind === 'edit') return onChangeLevel(dialog.playerSkill, level);
        return Promise.resolve(false);
    };

    return (
        <div className="grid">
            {canAssign && (
                <div className="col-12 lg:col-5">
                    <h6 className="mt-0">Habilidades disponibles</h6>
                    {catalogError && <Message severity="error" text={catalogError} className="w-full mb-3" />}
                    <SearchInput value={search} onChange={setSearch} ariaLabel="Buscar habilidades disponibles" placeholder="Buscar habilidad" className="w-full mb-3" />
                    {available.length === 0 ? (
                        <EmptyState icon="pi-check-circle" title={search.trim() ? 'Ninguna habilidad coincide con la búsqueda.' : 'El jugador ya tiene todas las habilidades del catálogo.'} />
                    ) : (
                        <ul className="list-none p-0 m-0">
                            {available.map((skill) => (
                                <li key={skill.id} className="flex align-items-center justify-content-between gap-2 py-2 border-bottom-1 surface-border">
                                    <div className="flex flex-column">
                                        <span className="text-900 font-medium">
                                            {skill.name} <Tag value={SKILL_CATEGORY_LABELS[skill.category]} severity={SKILL_CATEGORY_SEVERITY[skill.category]} className="ml-1" />
                                        </span>
                                        <span className="text-600 text-sm">{skill.description}</span>
                                    </div>
                                    <Button label="Asignar" icon="pi pi-plus" size="small" outlined onClick={() => setDialog({ kind: 'assign', skill })} />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <div className={canAssign ? 'col-12 lg:col-7' : 'col-12'}>
                <div className="flex align-items-center justify-content-between mb-2">
                    <h6 className="m-0">
                        Habilidades del jugador <span className="text-600 font-normal">({skills.length})</span>
                    </h6>
                    {average !== null && (
                        <span className="text-600">
                            Media general: <span className="text-900 font-bold">{average}</span>
                        </span>
                    )}
                </div>
                {skills.length === 0 ? (
                    <EmptyState icon="pi-star" title="El jugador no tiene habilidades registradas." />
                ) : (
                    <ul className="list-none p-0 m-0">
                        {skills.map((playerSkill) => (
                            <li key={playerSkill.id} className="py-2 border-bottom-1 surface-border">
                                <div className="flex align-items-center justify-content-between gap-2 mb-2">
                                    <span className="text-900 font-medium">
                                        {playerSkill.skill.name} <Tag value={SKILL_CATEGORY_LABELS[playerSkill.skill.category]} severity={SKILL_CATEGORY_SEVERITY[playerSkill.skill.category]} className="ml-1" />
                                    </span>
                                    <div className="flex gap-1">
                                        {canChangeLevel && (
                                            <Button
                                                icon="pi pi-sliders-h"
                                                rounded
                                                text
                                                tooltip="Cambiar nivel"
                                                tooltipOptions={{ position: 'top' }}
                                                aria-label={`Cambiar nivel de ${playerSkill.skill.name}`}
                                                onClick={() => setDialog({ kind: 'edit', playerSkill })}
                                            />
                                        )}
                                        {canRemove && (
                                            <Button
                                                icon="pi pi-trash"
                                                rounded
                                                text
                                                severity="danger"
                                                tooltip="Retirar"
                                                tooltipOptions={{ position: 'top' }}
                                                aria-label={`Retirar ${playerSkill.skill.name}`}
                                                loading={removingId === playerSkill.id}
                                                disabled={removingId !== null}
                                                onClick={() => handleRemove(playerSkill)}
                                            />
                                        )}
                                    </div>
                                </div>
                                <ProgressBar value={playerSkill.level} style={{ height: '1rem' }} aria-label={`Nivel ${playerSkill.level} de 100`} />
                            </li>
                        ))}
                    </ul>
                )}
                {canRemove && skills.length > 0 && <small className="text-600 block mt-2">Retirar una habilidad solo elimina la asociación con el jugador: sigue disponible en el catálogo.</small>}
            </div>

            <SkillLevelDialog
                visible={dialog !== null}
                skillName={dialog?.kind === 'assign' ? dialog.skill.name : dialog?.playerSkill.skill.name ?? ''}
                initialLevel={dialog?.kind === 'edit' ? dialog.playerSkill.level : DEFAULT_LEVEL}
                confirmLabel={dialog?.kind === 'assign' ? 'Asignar' : 'Guardar nivel'}
                onHide={() => setDialog(null)}
                onSubmit={submitLevel}
            />
        </div>
    );
}
