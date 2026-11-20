import { sportsApiFetch, toQueryString } from './sports-api';
import { CreateTeamSportPayload, MessageResponse, TeamSportAssociation, TeamSportQuery } from '@/types/sports';

const TEAM_SPORTS = '/team-sports';

// ?teamId → deportes del equipo; ?sportId → equipos del deporte
export function listTeamSports(query: TeamSportQuery = {}, signal?: AbortSignal): Promise<TeamSportAssociation[]> {
    return sportsApiFetch<TeamSportAssociation[]>(`${TEAM_SPORTS}${toQueryString({ ...query })}`, { signal });
}

export function createTeamSport(payload: CreateTeamSportPayload): Promise<TeamSportAssociation> {
    return sportsApiFetch<TeamSportAssociation>(TEAM_SPORTS, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

// Retira solo la asociación: no borra el equipo ni el deporte
export function deleteTeamSport(id: number): Promise<MessageResponse> {
    return sportsApiFetch<MessageResponse>(`${TEAM_SPORTS}/${id}`, { method: 'DELETE' });
}
