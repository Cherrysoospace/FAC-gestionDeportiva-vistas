'use client';

import { useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ActiveTag from '@/components/ui/ActiveTag';
import { TEAM_MODALITY_LABELS } from '@/lib/team-labels';
import { RelatedTeam, Team } from '@/types/sports';

interface RelatedTeamsPanelProps {
    teamId: number;
    relatedTeams: RelatedTeam[];
    /** Equipos activos para elegir (GET /teams?active=true) */
    candidates: Team[];
    loading: boolean;
    error: string | null;
    canRelate: boolean;
    canUnrelate: boolean;
    onRelate: (relatedTeamId: number) => Promise<boolean>;
    onUnrelate: (team: RelatedTeam) => Promise<void>;
}

// Autorrelación Equipo n — n Equipo del diagrama de clases. Es simétrica.
export default function RelatedTeamsPanel({ teamId, relatedTeams, candidates, loading, error, canRelate, canUnrelate, onRelate, onUnrelate }: RelatedTeamsPanelProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);

    // Ni el propio equipo ni los que ya están relacionados
    const options = useMemo(() => {
        const relatedIds = new Set(relatedTeams.map((team) => team.id));
        return candidates.filter((team) => team.id !== teamId && !relatedIds.has(team.id)).map((team) => ({ label: `${team.name} · ${team.city} (${TEAM_MODALITY_LABELS[team.modality]})`, value: team.id }));
    }, [candidates, relatedTeams, teamId]);

    const handleRelate = async () => {
        if (selected === null) return;
        setBusy(true);
        const ok = await onRelate(selected);
        setBusy(false);
        if (ok) setSelected(null);
    };

    const handleUnrelate = async (team: RelatedTeam) => {
        setBusy(true);
        await onUnrelate(team);
        setBusy(false);
    };

    if (error) return <Message severity="error" text={error} className="w-full" />;

    return (
        <div>
            {canRelate && (
                <div className="flex flex-column md:flex-row gap-2 mb-3">
                    <Dropdown
                        value={selected}
                        options={options}
                        onChange={(event) => setSelected((event.value as number | null) ?? null)}
                        placeholder="Selecciona un equipo para relacionar"
                        emptyMessage="No hay más equipos activos para relacionar"
                        aria-label="Equipo a relacionar"
                        filter={options.length > 8}
                        showClear
                        className="w-full md:w-30rem"
                    />
                    <Button label="Relacionar" icon="pi pi-link" onClick={handleRelate} disabled={selected === null || busy} loading={busy && selected !== null} />
                </div>
            )}

            {loading ? (
                <Skeleton height="6rem" />
            ) : relatedTeams.length === 0 ? (
                <EmptyState icon="pi-sitemap" title="El equipo no tiene equipos relacionados." />
            ) : (
                <ul className="list-none p-0 m-0">
                    {relatedTeams.map((team) => (
                        <li key={team.id} className="flex flex-column sm:flex-row sm:align-items-center justify-content-between gap-2 py-2 border-bottom-1 surface-border">
                            <div className="flex align-items-center gap-2">
                                <span className="text-900 font-medium">{team.name}</span>
                                <span className="text-600">
                                    {team.city} · {TEAM_MODALITY_LABELS[team.modality]}
                                </span>
                                {!team.active && <ActiveTag active={false} />}
                            </div>
                            {canUnrelate && <Button label="Quitar relación" icon="pi pi-times" size="small" text severity="danger" disabled={busy} onClick={() => handleUnrelate(team)} />}
                        </li>
                    ))}
                </ul>
            )}
            <small className="text-600 block mt-2">La relación es en ambos sentidos: también aparece en el detalle del otro equipo. Quitarla no borra ninguno de los dos.</small>
        </div>
    );
}
