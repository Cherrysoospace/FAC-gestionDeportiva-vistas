import { sportsApiFetch, toQueryString } from './sports-api';
import { CreateTeamPlayerPayload, ReleaseTeamPlayerPayload, ReleaseTeamPlayerResult, TeamPlayer, TeamPlayerQuery, UpdateTeamPlayerPayload } from '@/types/sports';

const TEAM_PLAYERS = '/team-players';

// ?teamId → plantilla e historial del equipo; ?playerId → equipos del jugador
export function listTeamPlayers(query: TeamPlayerQuery = {}, signal?: AbortSignal): Promise<TeamPlayer[]> {
    return sportsApiFetch<TeamPlayer[]>(`${TEAM_PLAYERS}${toQueryString({ ...query })}`, { signal });
}

export function createTeamPlayer(payload: CreateTeamPlayerPayload): Promise<TeamPlayer> {
    return sportsApiFetch<TeamPlayer>(TEAM_PLAYERS, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function updateTeamPlayer(id: number, payload: UpdateTeamPlayerPayload): Promise<TeamPlayer> {
    return sportsApiFetch<TeamPlayer>(`${TEAM_PLAYERS}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}

// Retira al jugador sin borrar el contrato: queda en el historial de traspasos
export function releaseTeamPlayer(id: number, payload: ReleaseTeamPlayerPayload): Promise<ReleaseTeamPlayerResult> {
    return sportsApiFetch<ReleaseTeamPlayerResult>(`${TEAM_PLAYERS}/${id}/release`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}
