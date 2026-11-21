'use client';

import { useRef } from 'react';
import { Button } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import {
    MY_FAN_VIEW_ENDPOINTS,
    MY_FAVORITE_TEAM_ADD_ENDPOINT,
    MY_FAVORITE_TEAM_REMOVE_ENDPOINT,
    MY_FAVORITE_TEAMS_VIEW_ENDPOINTS
} from '@/lib/fan-constants';
import { TEAM_DETAIL_ENDPOINTS, TEAMS_VIEW_ENDPOINTS } from '@/lib/team-constants';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { FavoriteTeam } from '@/types/sports';
import FavoriteTeamsPanel from '../mi-aficionado/components/FavoriteTeamsPanel';
import { useMyFanProfile } from '../mi-aficionado/hooks/useMyFanProfile';

export default function FavoriteTeamsPage() {
    return (
        <ProtectedRoute requiredEndpoints={MY_FAVORITE_TEAMS_VIEW_ENDPOINTS}>
            <FavoriteTeamsContent />
        </ProtectedRoute>
    );
}

function FavoriteTeamsContent() {
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canViewMyFan = can(...MY_FAN_VIEW_ENDPOINTS);
    const canAddFavorite = can(MY_FAVORITE_TEAM_ADD_ENDPOINT);
    const canRemoveFavorite = can(MY_FAVORITE_TEAM_REMOVE_ENDPOINT);
    const canLoadTeams = can(...TEAMS_VIEW_ENDPOINTS);
    const canViewTeamDetail = can(...TEAM_DETAIL_ENDPOINTS);

    const {
        fan,
        notRegistered,
        favorites,
        loadingFavorites,
        favoritesError,
        teams,
        reload,
        addFavorite,
        removeFavorite
    } = useMyFanProfile({
        loadProfile: canViewMyFan,
        loadFavorites: true,
        loadTeamOptions: canAddFavorite && canLoadTeams
    });

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const handleAdd = async (teamId: number) => {
        const result = await addFavorite(teamId);
        const name = teams.find((item) => item.id === teamId)?.name ?? 'El equipo';
        notify(result, `${name} se agregó a tus equipos favoritos.`, 'No se pudo agregar a favoritos');
        return result.ok;
    };

    const handleRemove = async (favorite: FavoriteTeam) => {
        const result = await removeFavorite(favorite.team.id);
        notify(result, `${favorite.team.name} fue retirado de tus favoritos.`, 'No se pudo retirar el equipo');
    };

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title="Equipos favoritos"
                subtitle="Sigue a tus equipos preferidos para recibir notificaciones cuando se programen o jueguen sus partidos."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Equipos favoritos' }]}
                actions={<Button label="Actualizar" icon="pi pi-refresh" outlined onClick={reload} />}
            />

            <div className="card">
                <FavoriteTeamsPanel
                    favorites={favorites}
                    teams={teams}
                    loading={loadingFavorites}
                    error={favoritesError}
                    profileMissing={notRegistered}
                    profileInactive={fan !== null && !fan.active}
                    profileHref={canViewMyFan ? '/mi-aficionado' : undefined}
                    canAdd={canAddFavorite}
                    canRemove={canRemoveFavorite}
                    canLoadTeams={canLoadTeams}
                    canViewTeamDetail={canViewTeamDetail}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                />
            </div>
        </>
    );
}
