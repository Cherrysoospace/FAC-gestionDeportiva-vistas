'use client';

import { useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import EmptyState from '@/components/ui/EmptyState';
import { FormActionResult } from '@/lib/form-action';
import { finalPhasesClient } from '@/lib/phase-api';
import { FinalPhaseFormValues, toCreateFinalPhasePayload, toUpdateFinalPhasePayload } from '@/lib/phase-form';
import { FINAL_ROUND_LABELS } from '@/lib/phase-labels';
import { formatDay } from '@/lib/tournament-labels';
import { FinalPhase, Tournament } from '@/types/sports';
import { useResourceList } from '../../hooks/useResourceList';
import FinalPhaseFormDialog from './FinalPhaseFormDialog';
import { PhaseNotify } from './phase-types';

interface FinalPhasesPanelProps {
    tournament: Tournament;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    notify: PhaseNotify;
    /** Se llama tras crear, editar o eliminar (refresca los conteos del torneo) */
    onChanged: () => void;
}

// Fases finales del torneo (clase Fase final del diagrama): octavos, cuartos, semifinal, tercer puesto y final.
export default function FinalPhasesPanel({ tournament, canCreate, canUpdate, canDelete, notify, onChanged }: FinalPhasesPanelProps) {
    const query = useMemo(() => ({ tournamentId: tournament.id }), [tournament.id]);
    const { items, loading, error, reload, create, update, remove } = useResourceList(finalPhasesClient, query);
    const [dialog, setDialog] = useState<{ visible: boolean; phase: FinalPhase | null }>({ visible: false, phase: null });

    // Misma regla del backend: un torneo finalizado o cancelado ya no cambia sus fases
    const locked = tournament.status === 'FINISHED' || tournament.status === 'CANCELLED';
    const showActions = !locked && (canUpdate || canDelete);

    const phases = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);

    const handleSubmit = async (values: FinalPhaseFormValues): Promise<FormActionResult> => {
        const editing = dialog.phase;
        const result = editing ? await update(editing.id, toUpdateFinalPhasePayload(values, editing)) : await create(toCreateFinalPhasePayload(values, tournament.id));
        if (result.ok || !result.validation) notify(result, editing ? 'Fase final actualizada.' : 'Fase final creada.', 'No se pudo guardar la fase final');
        if (result.ok) onChanged();
        return result;
    };

    const handleDelete = (phase: FinalPhase) =>
        confirmDialog({
            header: 'Eliminar fase final',
            message: `¿Eliminar la fase "${phase.name}"? Solo se puede eliminar si no tiene partidos asociados.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                const result = await remove(phase.id);
                // 409: el backend indica si lo bloquean partidos asociados
                notify(result, `La fase "${phase.name}" fue eliminada.`, 'No se puede eliminar la fase final');
                if (result.ok) onChanged();
            }
        });

    const actionsBody = (phase: FinalPhase) => (
        <div className="flex gap-1">
            {canUpdate && <Button icon="pi pi-pencil" rounded text tooltip="Editar" tooltipOptions={{ position: 'top' }} aria-label={`Editar ${phase.name}`} onClick={() => setDialog({ visible: true, phase })} />}
            {canDelete && <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" tooltipOptions={{ position: 'top' }} aria-label={`Eliminar ${phase.name}`} onClick={() => handleDelete(phase)} />}
        </div>
    );

    if (error) {
        return (
            <div className="flex flex-column sm:flex-row sm:align-items-center gap-3">
                <Message severity="error" text={error} className="w-full" />
                <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
            </div>
        );
    }

    return (
        <div>
            {locked && <Message severity="info" text="El torneo está finalizado o cancelado: ya no se pueden modificar sus fases." className="w-full mb-3" />}
            {canCreate && !locked && (
                <div className="flex justify-content-end mb-3">
                    <Button label="Nueva fase final" icon="pi pi-plus" size="small" onClick={() => setDialog({ visible: true, phase: null })} />
                </div>
            )}

            <DataTable value={phases} dataKey="id" loading={loading} emptyMessage={<EmptyState icon="pi-sitemap" title="El torneo no tiene fases finales." description="Define las rondas de eliminación directa del torneo." />}>
                <Column header="Fase" body={(phase: FinalPhase) => <span className="text-900 font-medium">{phase.name}</span>} />
                <Column header="Ronda" body={(phase: FinalPhase) => <Tag value={FINAL_ROUND_LABELS[phase.round]} severity="info" />} />
                <Column header="Orden" field="order" />
                <Column header="Inicio" body={(phase: FinalPhase) => formatDay(phase.startDate)} />
                <Column header="Fin" body={(phase: FinalPhase) => formatDay(phase.endDate)} />
                <Column header="Partidos" field="matchesCount" />
                {showActions && <Column header="Acciones" body={actionsBody} headerClassName="w-8rem" />}
            </DataTable>

            <FinalPhaseFormDialog visible={dialog.visible} phase={dialog.phase} tournament={tournament} onHide={() => setDialog({ visible: false, phase: null })} onSubmit={handleSubmit} />
        </div>
    );
}

