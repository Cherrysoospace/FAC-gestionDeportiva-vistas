'use client';

import Link from 'next/link';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import EmptyState from '@/components/ui/EmptyState';
import { CONTRACT_STAGE_LABELS, CONTRACT_STAGE_SEVERITY, RELEASE_REASON_LABELS } from '@/lib/player-labels';
import { formatDay } from '@/lib/tournament-labels';
import { TeamPlayer } from '@/types/sports';

interface TeamRosterPanelProps {
    roster: TeamPlayer[];
    history: TeamPlayer[];
    loading: boolean;
    error: string | null;
    canAssign: boolean;
    canEdit: boolean;
    canRelease: boolean;
    /** El usuario puede abrir el perfil del jugador */
    canViewPlayer: boolean;
    onAssign: () => void;
    onEdit: (contract: TeamPlayer) => void;
    onRelease: (contract: TeamPlayer) => void;
}

const year = (date: string) => date.slice(0, 4);

// HU-GD-05: jugadores actuales del equipo e historial de traspasos (mockup "Plantilla del equipo").
export default function TeamRosterPanel({ roster, history, loading, error, canAssign, canEdit, canRelease, canViewPlayer, onAssign, onEdit, onRelease }: TeamRosterPanelProps) {
    if (error) return <Message severity="error" text={error} className="w-full" />;

    const playerBody = (contract: TeamPlayer) =>
        canViewPlayer ? (
            <Link href={`/jugadores/${contract.player.id}`} className="text-900 font-medium">
                {contract.player.fullName}
            </Link>
        ) : (
            <span className="text-900 font-medium">{contract.player.fullName}</span>
        );

    const actionsBody = (contract: TeamPlayer) => (
        <div className="flex gap-1">
            {canEdit && <Button icon="pi pi-pencil" rounded text tooltip="Editar fechas" tooltipOptions={{ position: 'top' }} aria-label={`Editar contrato de ${contract.player.fullName}`} onClick={() => onEdit(contract)} />}
            {canRelease && (
                <Button icon="pi pi-sign-out" rounded text severity="danger" tooltip="Retirar de la plantilla" tooltipOptions={{ position: 'top' }} aria-label={`Retirar a ${contract.player.fullName}`} onClick={() => onRelease(contract)} />
            )}
        </div>
    );

    return (
        <div className="flex flex-column gap-4">
            <div>
                <div className="flex flex-column sm:flex-row sm:align-items-center justify-content-between gap-2 mb-2">
                    <h6 className="m-0">
                        Jugadores actuales <span className="text-600 font-normal">({roster.length})</span>
                    </h6>
                    {canAssign && <Button label="Asignar jugador" icon="pi pi-plus" onClick={onAssign} />}
                </div>
                <DataTable value={roster} dataKey="id" loading={loading} emptyMessage={<EmptyState icon="pi-users" title="El equipo no tiene jugadores en la plantilla." />}>
                    <Column header="Jugador" body={playerBody} />
                    <Column header="Posición" body={(contract: TeamPlayer) => <Tag value={contract.player.position} severity="info" />} />
                    <Column header="Fecha inicio" body={(contract: TeamPlayer) => formatDay(contract.startDate)} />
                    <Column header="Fecha fin" body={(contract: TeamPlayer) => formatDay(contract.endDate)} />
                    <Column header="Estado del contrato" body={(contract: TeamPlayer) => <Tag value={CONTRACT_STAGE_LABELS[contract.stage]} severity={CONTRACT_STAGE_SEVERITY[contract.stage]} />} />
                    {(canEdit || canRelease) && <Column header="Acciones" body={actionsBody} headerClassName="w-8rem" />}
                </DataTable>
            </div>

            <div>
                <h6 className="mt-0 mb-2">
                    Historial de jugadores <span className="text-600 font-normal">({history.length})</span>
                </h6>
                <DataTable value={history} dataKey="id" loading={loading} paginator={history.length > 10} rows={10} emptyMessage={<EmptyState icon="pi-history" title="Sin traspasos registrados." />}>
                    <Column header="Jugador" body={playerBody} />
                    <Column header="Período" body={(contract: TeamPlayer) => `${year(contract.startDate)} – ${year(contract.releaseDate ?? contract.endDate)}`} />
                    <Column header="Fecha fin" body={(contract: TeamPlayer) => formatDay(contract.releaseDate ?? contract.endDate)} />
                    <Column header="Motivo" body={(contract: TeamPlayer) => (contract.releaseReason ? <Tag value={RELEASE_REASON_LABELS[contract.releaseReason]} severity="warning" /> : <Tag value="Contrato vencido" severity={null} />)} />
                </DataTable>
            </div>
        </div>
    );
}
