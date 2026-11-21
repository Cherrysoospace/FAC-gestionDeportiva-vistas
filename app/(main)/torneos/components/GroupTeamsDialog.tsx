'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import EmptyState from '@/components/ui/EmptyState';
import { describeError } from '@/lib/api-errors';
import { listGroupTeams, listRegistrations } from '@/lib/competition-api';
import { runFormAction } from '@/lib/form-action';
import { assignGroupTeam, removeGroupTeam } from '@/lib/phase-api';
import { GroupPhase, GroupTeam, Registration } from '@/types/sports';

interface GroupTeamsDialogProps {
    visible: boolean;
    group: GroupPhase | null;
    /** Torneo cerrado (finalizado o cancelado): el backend ya no permite cambiar los equipos */
    locked: boolean;
    canAssign: boolean;
    canRemove: boolean;
    /** GET /registrations: necesario para ofrecer los equipos inscritos al asignar */
    canListRegistrations: boolean;
    onHide: () => void;
    /** Se llama al asignar o retirar un equipo (para refrescar los conteos del grupo) */
    onChanged: () => void;
}

// Equipos de un grupo (Grupo 1 — n Equipo del diagrama): se eligen entre los inscritos del torneo.
export default function GroupTeamsDialog({ visible, group, locked, canAssign, canRemove, canListRegistrations, onHide, onChanged }: GroupTeamsDialogProps) {
    const [teams, setTeams] = useState<GroupTeam[]>([]);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);

    const groupId = group?.id ?? null;
    const tournamentId = group?.tournament.id ?? null;
    const showAssign = canAssign && canListRegistrations && !locked;

    useEffect(() => {
        if (!visible || groupId === null || tournamentId === null) return;
        const controller = new AbortController();
        setLoading(true);
        setLoadError(null);
        setActionError(null);
        setSelected(null);

        Promise.all([listGroupTeams(groupId, controller.signal), showAssign ? listRegistrations({ tournamentId, status: 'ACTIVE' }, controller.signal) : Promise.resolve<Registration[]>([])])
            .then(([groupTeams, activeRegistrations]) => {
                setTeams(groupTeams);
                setRegistrations(activeRegistrations);
            })
            .catch((cause) => {
                if (!controller.signal.aborted) setLoadError(describeError(cause));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [visible, groupId, tournamentId, showAssign]);

    // Equipos inscritos que todavía no están en este grupo (Set en memoria, sin consultas extra)
    const options = useMemo(() => {
        const inGroup = new Set(teams.map((team) => team.id));
        return registrations.filter((registration) => !inGroup.has(registration.team.id)).map((registration) => ({ label: `${registration.team.name} (${registration.team.city})`, value: registration.team.id }));
    }, [teams, registrations]);

    const handleAssign = useCallback(async () => {
        if (groupId === null || selected === null) return;
        setBusy(true);
        setActionError(null);
        const result = await runFormAction(async () => {
            setTeams(await assignGroupTeam(groupId, { teamId: selected }));
        });
        setBusy(false);
        if (result.ok) {
            setSelected(null);
            onChanged();
        } else {
            // 400 (equipo ya en otro grupo, torneo cerrado...), 403 o 503
            setActionError(result.error ?? 'No se pudo asignar el equipo');
        }
    }, [groupId, selected, onChanged]);

    const handleRemove = async (team: GroupTeam) => {
        if (groupId === null) return;
        setBusy(true);
        setActionError(null);
        const result = await runFormAction(async () => {
            await removeGroupTeam(groupId, team.id);
            setTeams((current) => current.filter((item) => item.id !== team.id));
        });
        setBusy(false);
        if (result.ok) onChanged();
        else setActionError(result.error ?? 'No se pudo retirar el equipo');
    };

    const actionsBody = (team: GroupTeam) => <Button icon="pi pi-times" rounded text severity="danger" tooltip="Retirar del grupo" tooltipOptions={{ position: 'top' }} aria-label={`Retirar ${team.name} del grupo`} disabled={busy} onClick={() => handleRemove(team)} />;

    return (
        <Dialog header={group ? `Equipos del grupo ${group.groupName} · ${group.name}` : 'Equipos del grupo'} visible={visible} onHide={onHide} className="w-full md:w-8 lg:w-6" breakpoints={{ '640px': '95vw' }} modal>
            {loadError && <Message severity="error" text={loadError} className="w-full mb-3" />}
            {actionError && <Message severity="error" text={actionError} className="w-full mb-3" />}
            {locked && <Message severity="info" text="El torneo está finalizado o cancelado: ya no se pueden cambiar los equipos del grupo." className="w-full mb-3" />}

            {showAssign && (
                <div className="flex flex-column sm:flex-row gap-2 mb-3">
                    <Dropdown value={selected} options={options} onChange={(event) => setSelected((event.value as number | null) ?? null)} placeholder={options.length === 0 ? 'No hay equipos inscritos disponibles' : 'Selecciona un equipo inscrito'} emptyMessage="No hay equipos inscritos disponibles" filter showClear className="flex-1" disabled={busy || options.length === 0} aria-label="Equipo inscrito a asignar" />
                    <Button label="Asignar" icon="pi pi-plus" className="w-auto" onClick={handleAssign} disabled={selected === null || busy} loading={busy && selected !== null} />
                </div>
            )}

            <DataTable value={teams} dataKey="id" loading={loading} emptyMessage={<EmptyState icon="pi-flag" title="El grupo no tiene equipos asignados." />}>
                <Column header="Equipo" body={(team: GroupTeam) => <span className="text-900 font-medium">{team.name}</span>} />
                <Column header="Ciudad" field="city" />
                <Column header="Modalidad" field="modality" />
                {canRemove && !locked && <Column header="Acciones" body={actionsBody} headerClassName="w-6rem" />}
            </DataTable>
        </Dialog>
    );
}

