import { createResourceClient, sportsApiFetch } from './sports-api';
import {
    AddFavoriteTeamPayload,
    CreateFanPayload,
    Fan,
    FanQuery,
    FavoriteTeam,
    MessageResponse,
    RegisterMyFanPayload,
    UpdateFanPayload,
    UpdateMyFanPayload
} from '@/types/sports';

const fansClient = createResourceClient<Fan, CreateFanPayload, UpdateFanPayload, FanQuery>('/fans');

export const listFans = fansClient.list;
export const getFan = fansClient.getById;
export const createFan = fansClient.create;
export const updateFan = fansClient.update;
export const deleteFan = fansClient.remove;

// Perfil propio (/me/fan)
export function getMyFanProfile(signal?: AbortSignal): Promise<Fan> {
    return sportsApiFetch<Fan>('/me/fan', { signal });
}

export function registerMyFanProfile(payload: RegisterMyFanPayload): Promise<Fan> {
    return sportsApiFetch<Fan>('/me/fan', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function updateMyFanProfile(payload: UpdateMyFanPayload): Promise<Fan> {
    return sportsApiFetch<Fan>('/me/fan', {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}

// Equipos favoritos (/me/favorite-teams)
export function listMyFavoriteTeams(signal?: AbortSignal): Promise<FavoriteTeam[]> {
    return sportsApiFetch<FavoriteTeam[]>('/me/favorite-teams', { signal });
}

export function addMyFavoriteTeam(payload: AddFavoriteTeamPayload): Promise<FavoriteTeam> {
    return sportsApiFetch<FavoriteTeam>('/me/favorite-teams', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

// Nota: el backend recibe teamId (id del equipo), no el id de la relación fan_teams
export function removeMyFavoriteTeam(teamId: number): Promise<MessageResponse> {
    return sportsApiFetch<MessageResponse>(`/me/favorite-teams/${teamId}`, {
        method: 'DELETE'
    });
}
