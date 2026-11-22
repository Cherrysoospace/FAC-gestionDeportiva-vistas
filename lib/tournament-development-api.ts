import { sportsApiFetch } from './sports-api';
import { TournamentDevelopment } from '@/types/sports';

// HU-GC-08b: resumen, fases, posiciones, llaves, partidos y anotaciones del torneo.
export function getTournamentDevelopment(tournamentId: number, signal?: AbortSignal): Promise<TournamentDevelopment> {
    return sportsApiFetch<TournamentDevelopment>(`/tournaments/${tournamentId}/development`, { signal });
}
