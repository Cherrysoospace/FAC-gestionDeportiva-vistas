'use client';

import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { describeError } from '@/lib/api-errors';
import { skillsClient } from '@/lib/skill-api';
import { SKILL_CATEGORY_LABELS, SKILL_CATEGORY_SEVERITY } from '@/lib/skill-constants';
import { listPlayerSkills } from '@/lib/skills-api';
import { PlayerSkill, Skill } from '@/types/sports';

interface SkillDetailDialogProps {
    skillId: number | null;
    canListPlayers: boolean;
    onHide: () => void;
}

// HU-GD-06 #5: información detallada de una habilidad (GET /skills/:id) con sus jugadores (GET /player-skills?skillId=).
export default function SkillDetailDialog({ skillId, canListPlayers, onHide }: SkillDetailDialogProps) {
    const [skill, setSkill] = useState<Skill | null>(null);
    const [players, setPlayers] = useState<PlayerSkill[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (skillId === null) return;
        const controller = new AbortController();
        setSkill(null);
        setPlayers(null);
        setError(null);
        Promise.all([skillsClient.getById(skillId, controller.signal), canListPlayers ? listPlayerSkills({ skillId }, controller.signal) : Promise.resolve(null)])
            .then(([loadedSkill, loadedPlayers]) => {
                setSkill(loadedSkill);
                setPlayers(loadedPlayers);
            })
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            });
        return () => controller.abort();
    }, [skillId, canListPlayers]);

    return (
        <Dialog header={skill ? skill.name : 'Detalle de la habilidad'} visible={skillId !== null} onHide={onHide} style={{ width: '40rem' }} breakpoints={{ '640px': '95vw' }} modal>
            {error && <Message severity="error" text={error} className="w-full" />}
            {!error && !skill && <Skeleton height="8rem" />}
            {!error && skill && (
                <div className="flex flex-column gap-3">
                    <div>
                        <div className="text-600 text-sm mb-1">Categoría</div>
                        <Tag value={SKILL_CATEGORY_LABELS[skill.category]} severity={SKILL_CATEGORY_SEVERITY[skill.category]} />
                    </div>
                    <div>
                        <div className="text-600 text-sm mb-1">Descripción</div>
                        <div className="text-900">{skill.description}</div>
                    </div>
                    {players && (
                        <div>
                            <h6 className="mb-2">Jugadores con esta habilidad ({players.length})</h6>
                            {players.length === 0 ? (
                                <span className="text-500">Ningún jugador tiene asignada esta habilidad.</span>
                            ) : (
                                <ul className="m-0 pl-3">
                                    {players.map((assignment) => (
                                        <li key={assignment.id}>
                                            {assignment.player.fullName}{' '}
                                            <span className="text-600">
                                                · {assignment.player.position} · nivel {assignment.level}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Dialog>
    );
}
