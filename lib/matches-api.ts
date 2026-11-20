import { sportsApiFetch, toQueryString } from './sports-api';
import { Board, CreateMatchPayload, Match, MatchQuery, MessageResponse, UpdateMatchPayload } from '@/types/sports';

const MATCHES = '/matches';

export function listMatches(query: MatchQuery = {}, signal?: AbortSignal): Promise<Match[]> {
    return sportsApiFetch<Match[]>(`${MATCHES}${toQueryString({ ...query })}`, { signal });
}

export function getMatch(id: number, signal?: AbortSignal): Promise<Match> {
    return sportsApiFetch<Match>(`${MATCHES}/${id}`, { signal });
}

export function createMatch(payload: CreateMatchPayload): Promise<Match> {
    return sportsApiFetch<Match>(MATCHES, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

// Editar (solo programados) o cambiar estado (iniciar / cancelar)
export function updateMatch(id: number, payload: UpdateMatchPayload): Promise<Match> {
    return sportsApiFetch<Match>(`${MATCHES}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}

export function deleteMatch(id: number): Promise<MessageResponse> {
    return sportsApiFetch<MessageResponse>(`${MATCHES}/${id}`, { method: 'DELETE' });
}

// HU-GC-09: última posición de cada participante y de la pelota
export function getBoard(matchId: number, signal?: AbortSignal): Promise<Board> {
    return sportsApiFetch<Board>(`/match-positions${toQueryString({ matchId })}`, { signal });
}
