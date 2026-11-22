'use client';

import { useEffect, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { listSkills } from '@/lib/skills-api';
import { Skill } from '@/types/sports';

/**
 * Catálogo de habilidades para los selectores. `enabled` = el usuario tiene
 * GET /gestion-deportiva/skills; si no, no se consulta.
 */
export function useSkillOptions(enabled: boolean) {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        listSkills({}, controller.signal)
            .then(setSkills)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [enabled]);

    return { skills, loading, error };
}
