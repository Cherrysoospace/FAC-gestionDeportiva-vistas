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
import { groupPhasesClient } from '@/lib/phase-api';
import { GroupPhaseFormValues, toCreateGroupPhasePayload, toUpdateGroupPhasePayload } from '@/lib/phase-form';
import { formatDay } from '@/lib/tournament-labels';
import { GroupPhase, Tournament } from '@/types/sports';
import { useResourceList } from '../../hooks/useResourceList';
import GroupPhaseFormDialog from './GroupPhaseFormDialog';
import GroupTeamsDialog from './GroupTeamsDialog';
import { PhaseNotify } from './phase-types';

interface GroupPhasesPanelProps {
    tournament: Tournament;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canListTeams: boolean;
    canAssignTeam: boolean;
    canRemoveTeam: boolean;
    canListRegistrations: boolean;
    notify: PhaseNotify;
    /** Se llama tras crear, editar o eliminar (refresca los conteos del torneo) */
    onChanged: () => void;
}

// Fases de grupos del torneo (clase Fase de grupos del diagrama), con sus equipos.
export default function GroupPhasesPanel({ tournament, canCreate, canUpdate, canDelete, canListTeams, canAssignTeam, canRemoveTeam, canListRegistrations, notify, onChanged }: GroupPhasesPanelProps) {
    const query = useMemo(() => ({ tournamentId: tournament.id }), [tournament.id]);
    const { items, loading, error, reload, create, update, remove } = useResourceList(groupPhasesClient, query);
    const [formDialog, setFormDialog] = useState<{ visible: boolean; phase: GroupPhase | null }>({ visible: false, phase: null });
    const [teamsGroup, setTeamsGroup] = useState<GroupPhase | null>(null);

    // Misma regla del backend: un torneo finalizado o cancelado ya no cambia sus fases
    const locked = tournament.status === 'FINISHED' || tournament.status === 'CANCELLED';
    const showActions = !locked && (canUpdate || canDelete);

    const groups = useMemo(() => [...items].sort((a, b) => a.order - b.order || a.groupName.localeCompare(b.groupName)), [items]);

    const handleSubmit = async (values: GroupPhaseFormValues): Promise<FormActionResult> => {
        const editing = formDialog.phase;
        const result = editing ? await update(editing.id, toUpdateGroupPhasePayload(values, editing)) : await create(toCreateGroupPhasePayload(values, tournament.id));
        if (result.ok || !result.validation) notify(result, editing ? 'Grupo actualizado.' : 'Grupo creado.', 'No se pudo guardar el grupo');
        if (result.ok) onChanged();
        return result;
    };

    const handleDelete = (phase: GroupPhase) =>
        confirmDialog({
            header: 'Eliminar grupo',
            message: `¿Eliminar el grupo ${phase.groupName} de "${phase.name}"? Solo se puede eliminar si no tiene equipos ni partidos asociados.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                const result = await remove(phase.id);
                // 409: el backend indica si lo bloquean equipos o partidos
                notify(result, `El grupo ${phase.groupName} fue eliminado.`, 'No se puede eliminar el grupo');
                if (result.ok) onChanged();
            }
        });

    const handleTeamsChanged = () => {
        reload();
        onChanged();
    };

    const actionsBody = (phase: GroupPhase) => (
        <div className="flex gap-1">
            {canUpdate && <Button icon="pi pi-pencil" rounded text tooltip="Editar" tooltipOptions={{ position: 'top' }} aria-label={`Editar el grupo ${phase.groupName}`} onClick={() => setFormDialog({ visible: true, phase })} />}
            {canDelete && <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" tooltipOptions={{ position: 'top' }} aria-label={`Eliminar el grupo ${phase.groupName}`} onClick={() => handleDelete(phase)} />}
        </div>
    );

    const teamsBody = (phase: GroupPhase) =>
        canListTeams ? <Button label={String(phase.teamsCount)} icon="pi pi-users" size="small" text aria-label={`Ver equipos del grupo ${phase.groupName}`} onClick={() => setTeamsGroup(phase)} /> : phase.teamsCount;

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
                    <Button label="Nuevo grupo" icon="pi pi-plus" size="small" onClick={() => setFormDialog({ visible: true, phase: null })} />
                </div>
            )}

            <DataTable value={groups} dataKey="id" loading={loading} emptyMessage={<EmptyState icon="pi-th-large" title="El torneo no tiene fases de grupos." description="Crea los grupos del torneo y asigna a ellos los equipos inscritos." />}>
                <Column header="Fase" body={(phase: GroupPhase) => <span className="text-900 font-medium">{phase.name}</span>} />
                <Column header="Grupo" body={(phase: GroupPhase) => <Tag value={phase.groupName} />} />
                <Column header="Orden" field="order" />
                <Column header="Clasificados" body={(phase: GroupPhase) => phase.qualifiersCount ?? <span className="text-500">Sin definir</span>} />
                <Column header="Inicio" body={(phase: GroupPhase) => formatDay(phase.startDate)} />
                <Column header="Fin" body={(phase: GroupPhase) => formatDay(phase.endDate)} />
                <Column header="Equipos" body={teamsBody} />
                <Column header="Partidos" field="matchesCount" />
                {showActions && <Column header="Acciones" body={actionsBody} headerClassName="w-8rem" />}
            </DataTable>

            <GroupPhaseFormDialog visible={formDialog.visible} phase={formDialog.phase} tournament={tournament} onHide={() => setFormDialog({ visible: false, phase: null })} onSubmit={handleSubmit} />
            <GroupTeamsDialog visible={teamsGroup !== null} group={teamsGroup} locked={locked} canAssign={canAssignTeam} canRemove={canRemoveTeam} canListRegistrations={canListRegistrations} onHide={() => setTeamsGroup(null)} onChanged={handleTeamsChanged} />
        </div>
    );
}
