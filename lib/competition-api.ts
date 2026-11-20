import { sportsApiFetch, toQueryString } from './sports-api';
import { Ball, BallQuery, FinalPhase, FinalPhaseQuery, GroupPhase, GroupPhaseQuery, GroupTeam, Registration, RegistrationQuery } from '@/types/sports';

// Consultas de catálogos de competencia que usan los selectores (ej. el formulario de partidos).

export function listGroupPhases(query: GroupPhaseQuery = {}, signal?: AbortSignal): Promise<GroupPhase[]> {
    return sportsApiFetch<GroupPhase[]>(`/group-phases${toQueryString({ ...query })}`, { signal });
}

export function listFinalPhases(query: FinalPhaseQuery = {}, signal?: AbortSignal): Promise<FinalPhase[]> {
    return sportsApiFetch<FinalPhase[]>(`/final-phases${toQueryString({ ...query })}`, { signal });
}

export function listGroupTeams(groupPhaseId: number, signal?: AbortSignal): Promise<GroupTeam[]> {
    return sportsApiFetch<GroupTeam[]>(`/group-phases/${groupPhaseId}/teams`, { signal });
}

export function listRegistrations(query: RegistrationQuery = {}, signal?: AbortSignal): Promise<Registration[]> {
    return sportsApiFetch<Registration[]>(`/registrations${toQueryString({ ...query })}`, { signal });
}

export function listBalls(query: BallQuery = {}, signal?: AbortSignal): Promise<Ball[]> {
    return sportsApiFetch<Ball[]>(`/balls${toQueryString({ ...query })}`, { signal });
}
