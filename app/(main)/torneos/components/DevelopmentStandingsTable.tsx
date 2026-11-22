import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { classNames } from 'primereact/utils';
import { formatGoalDifference, isQualifying } from '@/lib/tournament-development-labels';
import { DevelopmentGroup, DevelopmentStanding } from '@/types/sports';

// Tabla de posiciones de un grupo (HU-GC-08b). Posiciones y desempates los calcula ms-sports.
export default function DevelopmentStandingsTable({ group }: { group: DevelopmentGroup }) {
    const qualifies = (row: DevelopmentStanding) => isQualifying(row.position, group.qualifiersCount);

    const teamBody = (row: DevelopmentStanding) => (
        <span className={classNames({ 'text-green-600 font-semibold': qualifies(row) })}>
            {row.team.name}
            {qualifies(row) && <i className="pi pi-angle-double-up ml-2 text-xs" aria-label="Clasifica" title="Clasifica" />}
        </span>
    );

    return (
        <div className="border-1 surface-border border-round p-3 h-full">
            <div className="flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                <span className="text-900 font-semibold">{group.label}</span>
                {group.qualifiersCount !== null && <span className="text-600 text-sm">Clasifican {group.qualifiersCount}</span>}
            </div>
            <DataTable value={group.standings} dataKey="team.id" size="small" stripedRows emptyMessage="Este grupo aún no tiene equipos asignados." aria-label={`Tabla de posiciones del ${group.label}`}>
                <Column field="position" header="Pos" className="font-bold" />
                <Column header="Equipo" body={teamBody} />
                <Column field="played" header="PJ" />
                <Column field="won" header="PG" />
                <Column field="drawn" header="PE" />
                <Column field="lost" header="PP" />
                <Column field="goalsFor" header="GF" />
                <Column field="goalsAgainst" header="GC" />
                <Column header="DG" body={(row: DevelopmentStanding) => formatGoalDifference(row.goalDifference)} />
                <Column field="points" header="PTS" className="font-bold" />
            </DataTable>
        </div>
    );
}
