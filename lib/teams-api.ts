import { sportsApiFetch, toQueryString } from './sports-api';
import { CreateTeamPayload, CreateTeamRelationResult, MessageResponse, RelatedTeam, Team, TeamQuery, UpdateTeamPayload } from '@/types/sports';

const TEAMS = '/teams';

export function listTeams(query: TeamQuery = {}, signal?: AbortSignal): Promise<Team[]> {
    return sportsApiFetch<Team[]>(`${TEAMS}${toQueryString({ ...query })}`, { signal });
}

export function getTeam(id: number, signal?: AbortSignal): Promise<Team> {
    return sportsApiFetch<Team>(`${TEAMS}/${id}`, { signal });
}

export function createTeam(payload: CreateTeamPayload): Promise<Team> {
    return sportsApiFetch<Team>(TEAMS, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function updateTeam(id: number, payload: UpdateTeamPayload): Promise<Team> {
    return sportsApiFetch<Team>(`${TEAMS}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}

export function deleteTeam(id: number): Promise<MessageResponse> {
    return sportsApiFetch<MessageResponse>(`${TEAMS}/${id}`, { method: 'DELETE' });
}

// ---- Equipos relacionados (autorrelación Equipo n — n Equipo) ----

export function listRelatedTeams(teamId: number, signal?: AbortSignal): Promise<RelatedTeam[]> {
    return sportsApiFetch<RelatedTeam[]>(`${TEAMS}/${teamId}/related-teams`, { signal });
}

export function relateTeam(teamId: number, relatedTeamId: number): Promise<CreateTeamRelationResult> {
    return sportsApiFetch<CreateTeamRelationResult>(`${TEAMS}/${teamId}/related-teams`, {
        method: 'POST',
        body: JSON.stringify({ relatedTeamId })
    });
}

export function unrelateTeam(teamId: number, relatedTeamId: number): Promise<MessageResponse> {
    return sportsApiFetch<MessageResponse>(`${TEAMS}/${teamId}/related-teams/${relatedTeamId}`, { method: 'DELETE' });
}
