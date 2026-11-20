import { sportsApiFetch, toQueryString } from './sports-api';
import { CreatePlayerPayload, MessageResponse, Player, PlayerProfile, PlayerQuery, UpdatePlayerPayload } from '@/types/sports';

const PLAYERS = '/players';

export function listPlayers(query: PlayerQuery = {}, signal?: AbortSignal): Promise<Player[]> {
    return sportsApiFetch<Player[]>(`${PLAYERS}${toQueryString({ ...query })}`, { signal });
}

export function createPlayer(payload: CreatePlayerPayload): Promise<Player> {
    return sportsApiFetch<Player>(PLAYERS, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function updatePlayer(id: number, payload: UpdatePlayerPayload): Promise<Player> {
    return sportsApiFetch<Player>(`${PLAYERS}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}

export function deletePlayer(id: number): Promise<MessageResponse> {
    return sportsApiFetch<MessageResponse>(`${PLAYERS}/${id}`, { method: 'DELETE' });
}

// HU-GD-08: datos, equipos (actuales, próximos e historial) y habilidades
export function getPlayerProfile(id: number, signal?: AbortSignal): Promise<PlayerProfile> {
    return sportsApiFetch<PlayerProfile>(`${PLAYERS}/${id}/profile`, { signal });
}
