'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Message } from 'primereact/message';
import { MultiSelect } from 'primereact/multiselect';
import { Tag } from 'primereact/tag';
import EmptyState from '@/components/ui/EmptyState';
import { TEAM_MODALITY_LABELS } from '@/lib/team-labels';
import { formatDateTime } from '@/lib/tournament-labels';
import { Registration, RegistrationStatus, Team } from '@/types/sports';

interface TournamentRegistrationsPanelProps {
    registrations: Registration[];
    /** Equipos activos que practican el deporte del torneo */
    teams: Team[];
    sportName: string;
    loading: boolean;
    error: string | null;
    /** Solo se inscriben o retiran equipos cuando el torneo tiene inscripciones abiertas */
    canOpenRegistration: boolean;
    canCreate: boolean;
    canWithdraw: boolean;
    canViewTeam: boolean;
    onEnroll: (teamIds: number[]) => Promise<boolean>;
    onWithdraw: (registration: Registration) => Promise<void>;
}

const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
    ACTIVE: 'Activa',
    WITHDRAWN: 'Retirada'
};

const REGISTRATION_STATUS_SEVERITY: Record<RegistrationStatus, 'success' | 'warning'> = {
    ACTIVE: 'success',
    WITHDRAWN: 'warning'
};

export default function TournamentRegistrationsPanel({
    registrations,
    teams,
    sportName,
    loading,
    error,
    canOpenRegistration,
    canCreate,
    canWithdraw,
    canViewTeam,
    onEnroll,
    onWithdraw
}: TournamentRegistrationsPanelProps) {
    const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
    const [busy, setBusy] = useState(false);

    // Solo ofrecer equipos activos del deporte que no tengan inscripción ACTIVE en el torneo
    const availableTeamOptions = useMemo(() => {
        const activeTeamIds = new Set(registrations.filter((item) => item.status === 'ACTIVE').map((item) => item.team.id));
        return teams
            .filter((team) => !activeTeamIds.has(team.id))
            .map((team) => ({
                label: `${team.name} · ${team.city} (${TEAM_MODALITY_LABELS[team.modality]})`,
                value: team.id
            }));
    }, [registrations, teams]);

    const handleEnroll = async () => {
        if (selectedTeamIds.length === 0) return;
        setBusy(true);
        const ok = await onEnroll(selectedTeamIds);
        setBusy(false);
        if (ok) setSelectedTeamIds([]);
    };

    const confirmWithdraw = (registration: Registration) => {
        confirmDialog({
            header: 'Retirar inscripción',
            message: `¿Retirar a "${registration.team.name}" del torneo? Si ya está asignado a un grupo, debes retirarlo primero del grupo.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Retirar',
            rejectLabel: 'Volver',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                setBusy(true);
                await onWithdraw(registration);
                setBusy(false);
            }
        });
    };

    if (error) return <Message severity="error" text={error} className="w-full" />;

    const teamBody = (registration: Registration) =>
        canViewTeam ? (
            <Link href={`/equipos/${registration.team.id}`} className="text-900 font-medium">
                {registration.team.name}
            </Link>
        ) : (
            <span className="text-900 font-medium">{registration.team.name}</span>
        );

    const statusBody = (registration: Registration) => (
        <Tag value={REGISTRATION_STATUS_LABELS[registration.status]} severity={REGISTRATION_STATUS_SEVERITY[registration.status]} />
    );

    const actionsBody = (registration: Registration) => {
        const isActive = registration.status === 'ACTIVE';
        return (
            <Button
                label="Retirar"
                icon="pi pi-times"
                size="small"
                text
                severity="danger"
                disabled={busy || !isActive}
                tooltip={!isActive ? 'La inscripción ya fue retirada' : undefined}
                tooltipOptions={{ position: 'top', showOnDisabled: true }}
                onClick={() => confirmWithdraw(registration)}
            />
        );
    };

    return (
        <div>
            {!canOpenRegistration && (
                <Message
                    severity="info"
                    text="Las inscripciones solo se pueden registrar o retirar cuando el torneo está con inscripciones abiertas."
                    className="w-full mb-3"
                />
            )}

            {canCreate && canOpenRegistration && (
                <div className="flex flex-column md:flex-row gap-2 mb-3">
                    <MultiSelect
                        value={selectedTeamIds}
                        options={availableTeamOptions}
                        onChange={(event) => setSelectedTeamIds((event.value as number[] | null) ?? [])}
                        placeholder={`Selecciona equipos de ${sportName} para inscribir`}
                        emptyMessage={`No hay más equipos activos de ${sportName} disponibles`}
                        emptyFilterMessage="Ningún equipo coincide con la búsqueda"
                        aria-label="Equipos a inscribir"
                        filter={availableTeamOptions.length > 8}
                        display="chip"
                        maxSelectedLabels={3}
                        className="w-full md:w-30rem"
                    />
                    <Button
                        label="Inscribir equipos"
                        icon="pi pi-plus"
                        onClick={handleEnroll}
                        disabled={selectedTeamIds.length === 0 || busy}
                        loading={busy && selectedTeamIds.length > 0}
                    />
                </div>
            )}

            <DataTable
                value={registrations}
                dataKey="id"
                loading={loading}
                paginator={!loading && registrations.length > 10}
                rows={10}
                emptyMessage={
                    <EmptyState
                        icon="pi-users"
                        title="No hay equipos inscritos en este torneo."
                        description={
                            canOpenRegistration
                                ? `Inscribe equipos activos que practiquen ${sportName} cuando estén listos para competir.`
                                : undefined
                        }
                    />
                }
            >
                <Column header="Equipo" body={teamBody} />
                <Column header="Ciudad" body={(registration: Registration) => registration.team.city} />
                <Column header="Modalidad" body={(registration: Registration) => TEAM_MODALITY_LABELS[registration.team.modality]} />
                <Column header="Estado" body={statusBody} />
                <Column header="Fecha de inscripción" body={(registration: Registration) => formatDateTime(registration.registeredAt)} />
                <Column
                    header="Fecha de retiro"
                    body={(registration: Registration) =>
                        registration.withdrawnAt ? formatDateTime(registration.withdrawnAt) : <span className="text-500">—</span>
                    }
                />
                {canWithdraw && canOpenRegistration && <Column header="Acciones" body={actionsBody} headerClassName="w-8rem" />}
            </DataTable>
        </div>
    );
}

