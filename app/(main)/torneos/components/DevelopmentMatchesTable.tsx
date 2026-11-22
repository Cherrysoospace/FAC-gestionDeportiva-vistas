'use client';

import { useMemo, useState } from 'react';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { SelectButton } from 'primereact/selectbutton';
import { Tag } from 'primereact/tag';
import { formatDateTime } from '@/lib/tournament-labels';
import {
    DEVELOPMENT_MATCH_STATE_LABELS,
    DEVELOPMENT_MATCH_STATE_SEVERITY,
    developmentMatchState,
    DevelopmentMatchRow,
    emptyMatchesMessage,
    filterMatchesByState,
    formatDevelopmentScore,
    formatGoalMinute,
    MATCH_STATE_FILTER_OPTIONS,
    MatchStateFilter,
    sortGoalsByMinute
} from '@/lib/tournament-development-labels';

interface DevelopmentMatchesTableProps {
    matches: DevelopmentMatchRow[];
    /** Encabezado de la columna de contexto: 'Grupo' o 'Llave' */
    contextHeader: string;
}

// Partidos de una fase con su estado y, al expandir, sus anotaciones (HU-GC-08b).
export default function DevelopmentMatchesTable({ matches, contextHeader }: DevelopmentMatchesTableProps) {
    const [filter, setFilter] = useState<MatchStateFilter>('ALL');
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const visible = useMemo(() => filterMatchesByState(matches, filter), [matches, filter]);

    const stateBody = (match: DevelopmentMatchRow) => {
        const state = developmentMatchState(match);
        return <Tag value={DEVELOPMENT_MATCH_STATE_LABELS[state]} severity={DEVELOPMENT_MATCH_STATE_SEVERITY[state]} />;
    };

    const scoreBody = (match: DevelopmentMatchRow) => <span className={match.hasResult ? 'text-900 font-bold text-lg white-space-nowrap' : 'text-600'}>{formatDevelopmentScore(match)}</span>;

    const goalsBody = (match: DevelopmentMatchRow) => (match.goals.length > 0 ? match.goals.length : <span className="text-500">0</span>);

    const goalsTemplate = (match: DevelopmentMatchRow) => {
        if (match.goals.length === 0) {
            return <p className="text-600 m-0 py-2">Sin anotaciones</p>;
        }
        return (
            <ul className="list-none p-0 m-0" aria-label={`Anotaciones de ${match.homeTeam.name} vs ${match.awayTeam.name}`}>
                {sortGoalsByMinute(match.goals).map((goal) => (
                    <li key={goal.id} className="flex flex-wrap align-items-center gap-2 py-2 border-bottom-1 surface-border">
                        <i className="pi pi-star-fill text-primary" aria-hidden="true" />
                        <span className="font-bold text-900">{formatGoalMinute(goal.minute)}</span>
                        <span className="text-900">{goal.player.fullName}</span>
                        {goal.team && <span className="text-600 text-sm">{goal.team.name}</span>}
                        {goal.points !== 1 && <Tag value={`${goal.points} puntos`} severity="info" />}
                        {goal.description && <span className="text-600 text-sm font-italic">{goal.description}</span>}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div>
            <div className="flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                <span className="text-900 font-semibold">Partidos de la fase</span>
                <SelectButton value={filter} options={MATCH_STATE_FILTER_OPTIONS} onChange={(e) => e.value && setFilter(e.value)} aria-label="Filtrar partidos por estado" />
            </div>
            <DataTable
                value={visible}
                dataKey="id"
                size="small"
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data as Record<string, boolean>)}
                rowExpansionTemplate={goalsTemplate}
                emptyMessage={emptyMatchesMessage(matches.length, filter)}
            >
                <Column expander style={{ width: '3rem' }} />
                <Column header="Fecha" body={(match: DevelopmentMatchRow) => formatDateTime(match.scheduledAt)} />
                <Column field="context" header={contextHeader} />
                <Column header="Local" body={(match: DevelopmentMatchRow) => match.homeTeam.name} className="text-right" />
                <Column header="Marcador" body={scoreBody} className="text-center" />
                <Column header="Visitante" body={(match: DevelopmentMatchRow) => match.awayTeam.name} />
                <Column header="Escenario" body={(match: DevelopmentMatchRow) => match.venue.name} />
                <Column header="Anotaciones" body={goalsBody} className="text-center" />
                <Column header="Estado" body={stateBody} />
            </DataTable>
        </div>
    );
}
