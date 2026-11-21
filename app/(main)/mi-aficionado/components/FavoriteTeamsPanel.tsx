'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import EmptyState from '@/components/ui/EmptyState';
import { TEAM_MODALITY_LABELS } from '@/lib/team-labels';
import { formatDateTime } from '@/lib/tournament-labels';
import { FavoriteTeam, Team } from '@/types/sports';

interface FavoriteTeamsPanelProps {
    favorites: FavoriteTeam[];
    teams: Team[];
    loading: boolean;
    error: string | null;
    profileMissing: boolean;
    profileInactive: boolean;
    profileHref?: string;
    canAdd: boolean;
    canRemove: boolean;
    canLoadTeams: boolean;
    canViewTeamDetail: boolean;
    onAdd: (teamId: number) => Promise<boolean>;
    onRemove: (favorite: FavoriteTeam) => Promise<void>;
}

export default function FavoriteTeamsPanel({
    favorites,
    teams,
    loading,
    error,
    profileMissing,
    profileInactive,
    profileHref,
    canAdd,
    canRemove,
    canLoadTeams,
    canViewTeamDetail,
    onAdd,
    onRemove
}: FavoriteTeamsPanelProps) {
    const router = useRouter();
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);

    const availableTeamOptions = useMemo(() => {
        const favoriteIds = new Set(favorites.map((item) => item.team.id));
        return teams
            .filter((team) => !favoriteIds.has(team.id))
            .map((team) => ({
                label: `${team.name} · ${team.city} (${TEAM_MODALITY_LABELS[team.modality]})`,
                value: team.id
            }));
    }, [favorites, teams]);

    const handleAdd = async () => {
        if (selectedTeamId === null) return;
        setBusy(true);
        const ok = await onAdd(selectedTeamId);
        setBusy(false);
        if (ok) setSelectedTeamId(null);
    };

    const confirmRemove = (favorite: FavoriteTeam) => {
        confirmDialog({
            header: 'Retirar equipo favorito',
            message: `¿Quitar a "${favorite.team.name}" de tus equipos favoritos? Dejarás de recibir notificaciones de sus partidos.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Retirar',
            rejectLabel: 'Volver',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                setBusy(true);
                await onRemove(favorite);
                setBusy(false);
            }
        });
    };

    if (profileMissing) {
        return (
            <EmptyState
                icon="pi-id-card"
                title="Primero completa tu perfil de aficionado."
                description="Para guardar equipos favoritos, comprar boletos o apostar debes registrar tu ficha personal de aficionado."
                action={
                    profileHref ? (
                        <Button label="Registrar mi perfil de aficionado" icon="pi pi-user-plus" onClick={() => router.push(profileHref)} />
                    ) : undefined
                }
            />
        );
    }

    if (error) return <Message severity="error" text={error} className="w-full" />;

    const teamBody = (favorite: FavoriteTeam) => (
        <div className="flex align-items-center gap-2">
            {canViewTeamDetail ? (
                <Link href={`/equipos/${favorite.team.id}`} className="text-900 font-medium">
                    {favorite.team.name}
                </Link>
            ) : (
                <span className="text-900 font-medium">{favorite.team.name}</span>
            )}
            {!favorite.team.active && <Tag value="Inactivo" severity="danger" />}
        </div>
    );

    const actionsBody = (favorite: FavoriteTeam) => (
        <Button
            label="Retirar"
            icon="pi pi-times"
            size="small"
            text
            severity="danger"
            disabled={busy || profileInactive}
            onClick={() => confirmRemove(favorite)}
        />
    );

    return (
        <div>
            {profileInactive && (
                <Message
                    severity="warn"
                    text="Tu perfil de aficionado está inactivo: un administrador deportivo debe reactivarlo para modificar tus equipos favoritos."
                    className="w-full mb-3"
                />
            )}

            {canAdd && !profileInactive && !canLoadTeams && (
                <Message
                    severity="info"
                    text="No tienes permiso para listar el catálogo de equipos (GET /gestion-deportiva/teams)."
                    className="w-full mb-3"
                />
            )}

            {canAdd && !profileInactive && canLoadTeams && (
                <div className="flex flex-column md:flex-row gap-2 mb-3">
                    <Dropdown
                        value={selectedTeamId}
                        options={availableTeamOptions}
                        onChange={(event) => setSelectedTeamId((event.value as number | null) ?? null)}
                        placeholder="Selecciona un equipo activo para seguir"
                        emptyMessage="No hay más equipos activos disponibles"
                        aria-label="Equipo a agregar a favoritos"
                        filter={availableTeamOptions.length > 8}
                        showClear
                        className="w-full md:w-30rem"
                    />
                    <Button
                        label="Agregar a favoritos"
                        icon="pi pi-heart"
                        onClick={handleAdd}
                        disabled={selectedTeamId === null || busy}
                        loading={busy && selectedTeamId !== null}
                    />
                </div>
            )}

            <DataTable
                value={favorites}
                dataKey="id"
                loading={loading}
                paginator={!loading && favorites.length > 10}
                rows={10}
                emptyMessage={
                    <EmptyState
                        icon="pi-heart"
                        title="Aún no tienes equipos favoritos."
                        description="Agrega tus equipos favoritos para recibir notificaciones cuando se programen o jueguen sus partidos."
                    />
                }
            >
                <Column header="Equipo" body={teamBody} />
                <Column header="Ciudad" body={(favorite: FavoriteTeam) => favorite.team.city} />
                <Column header="Modalidad" body={(favorite: FavoriteTeam) => TEAM_MODALITY_LABELS[favorite.team.modality]} />
                <Column header="Agregado el" body={(favorite: FavoriteTeam) => formatDateTime(favorite.createdAt)} />
                {canRemove && !profileInactive && <Column header="Acciones" body={actionsBody} headerClassName="w-8rem" />}
            </DataTable>
        </div>
    );
}
