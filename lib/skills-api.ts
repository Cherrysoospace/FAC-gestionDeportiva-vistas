import { sportsApiFetch, toQueryString } from './sports-api';
import { CreatePlayerSkillPayload, MessageResponse, PlayerSkill, PlayerSkillQuery, Skill, SkillQuery, UpdatePlayerSkillPayload } from '@/types/sports';

// El catálogo de habilidades es solo backend (línea roja del diagrama): aquí
// se consulta para elegir. Las asignaciones (Habilidad-Jugador) sí tienen vista.

export function listSkills(query: SkillQuery = {}, signal?: AbortSignal): Promise<Skill[]> {
    return sportsApiFetch<Skill[]>(`/skills${toQueryString({ ...query })}`, { signal });
}

const PLAYER_SKILLS = '/player-skills';

export function listPlayerSkills(query: PlayerSkillQuery = {}, signal?: AbortSignal): Promise<PlayerSkill[]> {
    return sportsApiFetch<PlayerSkill[]>(`${PLAYER_SKILLS}${toQueryString({ ...query })}`, { signal });
}

export function createPlayerSkill(payload: CreatePlayerSkillPayload): Promise<PlayerSkill> {
    return sportsApiFetch<PlayerSkill>(PLAYER_SKILLS, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function updatePlayerSkill(id: number, payload: UpdatePlayerSkillPayload): Promise<PlayerSkill> {
    return sportsApiFetch<PlayerSkill>(`${PLAYER_SKILLS}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}

// Retira solo la asociación: la habilidad sigue en el catálogo
export function deletePlayerSkill(id: number): Promise<MessageResponse> {
    return sportsApiFetch<MessageResponse>(`${PLAYER_SKILLS}/${id}`, { method: 'DELETE' });
}
