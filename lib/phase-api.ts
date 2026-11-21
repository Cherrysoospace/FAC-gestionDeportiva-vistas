import { createResourceClient, sportsApiFetch } from './sports-api';
import {
    AssignGroupTeamPayload,
    CreateFinalPhasePayload,
    CreateGroupPhasePayload,
    FinalPhase,
    FinalPhaseQuery,
    GroupPhase,
    GroupPhaseQuery,
    GroupTeam,
    MessageResponse,
    UpdateFinalPhasePayload,
    UpdateGroupPhasePayload
} from '@/types/sports';

// CRUD de fases de grupos y fases finales. Los listados de solo lectura para
// selectores siguen en competition-api.ts.
export const groupPhasesClient = createResourceClient<GroupPhase, CreateGroupPhasePayload, UpdateGroupPhasePayload, GroupPhaseQuery>('/group-phases');

export const finalPhasesClient = createResourceClient<FinalPhase, CreateFinalPhasePayload, UpdateFinalPhasePayload, FinalPhaseQuery>('/final-phases');

// POST /group-phases/:id/teams devuelve la lista actualizada de equipos del grupo
export function assignGroupTeam(groupPhaseId: number, payload: AssignGroupTeamPayload): Promise<GroupTeam[]> {
    return sportsApiFetch<GroupTeam[]>(`/group-phases/${groupPhaseId}/teams`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function removeGroupTeam(groupPhaseId: number, teamId: number): Promise<MessageResponse> {
    return sportsApiFetch<MessageResponse>(`/group-phases/${groupPhaseId}/teams/${teamId}`, { method: 'DELETE' });
}

