'use client';

import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { runFormAction } from '@/lib/form-action';
import { createPlayerSkill, deletePlayerSkill, listSkills, updatePlayerSkill } from '@/lib/skills-api';
import { Skill } from '@/types/sports';

/**
 * HU-GD-07: asignar, cambiar el nivel y retirar habilidades de un jugador.
 * Las habilidades asignadas vienen en el perfil: `onChange` lo recarga.
 * `canListSkills` = el usuario tiene GET /gestion-deportiva/skills (catálogo para elegir).
 */
export function usePlayerSkills(playerId: number, canListSkills: boolean, onChange: () => void) {
    const [catalog, setCatalog] = useState<Skill[]>([]);
    const [catalogError, setCatalogError] = useState<string | null>(null);

    useEffect(() => {
        if (!canListSkills) return;
        const controller = new AbortController();
        setCatalogError(null);

        listSkills({}, controller.signal)
            .then(setCatalog)
            .catch((cause) => {
                if (!controller.signal.aborted) setCatalogError(describeError(cause));
            });

        return () => controller.abort();
    }, [canListSkills]);

    const assign = useCallback(
        (skillId: number, level: number) =>
            runFormAction(async () => {
                await createPlayerSkill({ playerId, skillId, level });
                onChange();
            }),
        [playerId, onChange]
    );

    const changeLevel = useCallback(
        (playerSkillId: number, level: number) =>
            runFormAction(async () => {
                await updatePlayerSkill(playerSkillId, { level });
                onChange();
            }),
        [onChange]
    );

    const remove = useCallback(
        (playerSkillId: number) =>
            runFormAction(async () => {
                await deletePlayerSkill(playerSkillId);
                onChange();
            }),
        [onChange]
    );

    return { catalog, catalogError, assign, changeLevel, remove };
}
