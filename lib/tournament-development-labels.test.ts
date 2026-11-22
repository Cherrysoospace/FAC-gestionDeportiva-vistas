import { describe, expect, it } from 'vitest';
import { DevelopmentFinalRound, DevelopmentGoal, DevelopmentGroupStage, DevelopmentMatch, DevelopmentTie, FinalRound, MatchStatus } from '@/types/sports';
import {
    developmentMatchState,
    emptyMatchesMessage,
    filterMatchesByState,
    finalRoundMatches,
    formatCurrentPhase,
    formatDevelopmentScore,
    formatEliminatedTeams,
    formatGoal,
    formatGoalDifference,
    formatPercentage,
    formatTieScore,
    groupStageMatches,
    isQualifying,
    isTieWinner,
    phaseTabLabel,
    sortGoalsByMinute,
    splitPhases,
    tieState,
    toBracketColumns
} from './tournament-development-labels';

const A = { id: 1, name: 'Atlético Manizales' };
const B = { id: 2, name: 'Deportivo Caldas' };

function match(overrides: Partial<DevelopmentMatch> = {}): DevelopmentMatch {
    return {
        id: 1,
        scheduledAt: '2026-04-18T20:00:00.000Z',
        status: 'SCHEDULED',
        homeTeam: A,
        awayTeam: B,
        homeScore: null,
        awayScore: null,
        hasResult: false,
        venue: { id: 1, name: 'Estadio Palogrande' },
        goals: [],
        ...overrides
    };
}

const finished = (overrides: Partial<DevelopmentMatch> = {}) => match({ status: 'FINISHED', homeScore: 2, awayScore: 1, hasResult: true, ...overrides });

function round(id: number, finalRound: FinalRound, order: number, ties: DevelopmentTie[] = []): DevelopmentFinalRound {
    return { type: 'FINAL', id, order, name: `Fase ${id}`, round: finalRound, label: finalRound, startDate: null, endDate: null, ties };
}

function goal(id: number, minute: number, team: DevelopmentGoal['team'] = A): DevelopmentGoal {
    return { id, minute, points: 1, description: null, player: { id, fullName: `Jugador ${id}` }, team };
}

describe('estado y marcador del partido', () => {
    it('finalizado solo con resultado registrado', () => {
        expect(developmentMatchState(finished())).toBe('FINISHED');
        expect(formatDevelopmentScore(finished())).toBe('2 - 1');
    });

    it('programado o en curso sin resultado queda pendiente', () => {
        (['SCHEDULED', 'IN_PROGRESS'] as MatchStatus[]).forEach((status) => {
            expect(developmentMatchState(match({ status }))).toBe('PENDING');
            expect(formatDevelopmentScore(match({ status }))).toBe('Pendiente');
        });
    });

    it('cancelado se distingue de pendiente', () => {
        const cancelled = match({ status: 'CANCELLED' });
        expect(developmentMatchState(cancelled)).toBe('CANCELLED');
        expect(formatDevelopmentScore(cancelled)).toBe('Cancelado');
    });

    it('muestra el marcador 0 - 0', () => {
        expect(formatDevelopmentScore(finished({ homeScore: 0, awayScore: 0 }))).toBe('0 - 0');
    });
});

describe('filtro de partidos', () => {
    const matches = [finished({ id: 1 }), match({ id: 2 }), match({ id: 3, status: 'CANCELLED' })];

    it('filtra finalizados y pendientes; Todos incluye cancelados', () => {
        expect(filterMatchesByState(matches, 'FINISHED').map((m) => m.id)).toEqual([1]);
        expect(filterMatchesByState(matches, 'PENDING').map((m) => m.id)).toEqual([2]);
        expect(filterMatchesByState(matches, 'ALL').map((m) => m.id)).toEqual([1, 2, 3]);
    });

    it('elige el mensaje vacío según el filtro', () => {
        expect(emptyMatchesMessage(0, 'FINISHED')).toBe('Sin partidos programados');
        expect(emptyMatchesMessage(3, 'FINISHED')).toBe('Sin partidos finalizados');
        expect(emptyMatchesMessage(3, 'PENDING')).toBe('Sin partidos pendientes');
    });
});

describe('partidos de una fase', () => {
    it('junta los partidos de los grupos en orden cronológico con su grupo', () => {
        const stage: DevelopmentGroupStage = {
            type: 'GROUP',
            order: 1,
            name: 'Fase de grupos',
            startDate: null,
            endDate: null,
            groups: [
                { id: 1, groupName: 'A', label: 'Grupo A', qualifiersCount: 2, teams: [], standings: [], matches: [match({ id: 5, scheduledAt: '2026-04-20T18:00:00.000Z' })] },
                { id: 2, groupName: 'B', label: 'Grupo B', qualifiersCount: 2, teams: [], standings: [], matches: [match({ id: 7, scheduledAt: '2026-04-19T18:00:00.000Z' })] }
            ]
        };
        expect(groupStageMatches(stage).map((m) => [m.id, m.context])).toEqual([
            [7, 'Grupo B'],
            [5, 'Grupo A']
        ]);
    });

    it('identifica la llave de cada partido de la fase final', () => {
        const tie: DevelopmentTie = { teamA: A, teamB: B, teamAScore: null, teamBScore: null, winner: null, matches: [match({ id: 9 })] };
        expect(finalRoundMatches(round(1, 'FINAL', 4, [tie]))[0].context).toBe('Atlético Manizales vs Deportivo Caldas');
    });
});

describe('anotaciones', () => {
    it('ordena por minuto', () => {
        expect(sortGoalsByMinute([goal(1, 78), goal(2, 23), goal(3, 51)]).map((g) => g.minute)).toEqual([23, 51, 78]);
    });

    it('muestra minuto, jugador y equipo si viene', () => {
        expect(formatGoal(goal(1, 23))).toBe("23' · Jugador 1 (Atlético Manizales)");
        expect(formatGoal(goal(1, 23, null))).toBe("23' · Jugador 1");
    });
});

describe('tabla de posiciones y resumen', () => {
    it('pone signo a la diferencia de gol positiva', () => {
        expect(formatGoalDifference(3)).toBe('+3');
        expect(formatGoalDifference(0)).toBe('0');
        expect(formatGoalDifference(-2)).toBe('-2');
    });

    it('marca clasificados solo con cupo definido', () => {
        expect(isQualifying(2, 2)).toBe(true);
        expect(isQualifying(3, 2)).toBe(false);
        expect(isQualifying(1, null)).toBe(false);
    });

    it('formatea el porcentaje con coma decimal', () => {
        expect(formatPercentage(68)).toBe('68%');
        expect(formatPercentage(66.7)).toBe('66,7%');
        expect(formatPercentage(0)).toBe('0%');
    });
});

describe('fases y llaves', () => {
    it('separa fases de grupos y rondas finales y les da nombre de pestaña', () => {
        const stage: DevelopmentGroupStage = { type: 'GROUP', order: 1, name: 'Fase de grupos', startDate: null, endDate: null, groups: [] };
        const final = { ...round(2, 'FINAL', 2), label: 'Final' };
        const { groupStages, finalRounds } = splitPhases([stage, final]);
        expect(groupStages).toEqual([stage]);
        expect(finalRounds).toEqual([final]);
        expect(phaseTabLabel(stage)).toBe('Fase de grupos');
        expect(phaseTabLabel(final)).toBe('Final');
    });

    it('ordena las rondas por posición en el cuadro y junta tercer puesto con la final', () => {
        const columns = toBracketColumns([round(5, 'FINAL', 4), round(3, 'SEMI_FINAL', 3), round(4, 'THIRD_PLACE', 4), round(2, 'QUARTER_FINAL', 2)]);
        expect(columns.map((column) => column.rounds.map((r) => r.round))).toEqual([['QUARTER_FINAL'], ['SEMI_FINAL'], ['THIRD_PLACE', 'FINAL']]);
    });

    it('resalta solo al ganador de la llave', () => {
        const tie = { winner: A };
        expect(isTieWinner(tie, A)).toBe(true);
        expect(isTieWinner(tie, B)).toBe(false);
        expect(isTieWinner({ winner: null }, A)).toBe(false);
    });

    it("muestra '-' en el marcador global sin resultados", () => {
        expect(formatTieScore(null)).toBe('-');
        expect(formatTieScore(0)).toBe('0');
    });

    it('deduce el estado de la llave', () => {
        expect(tieState({ winner: A, matches: [finished()] })).toBe('FINISHED');
        expect(tieState({ winner: null, matches: [finished(), match({ id: 2 })] })).toBe('PENDING');
        expect(tieState({ winner: null, matches: [finished({ homeScore: 1, awayScore: 1 })] })).toBe('DRAW');
        expect(tieState({ winner: null, matches: [match({ status: 'CANCELLED' })] })).toBe('CANCELLED');
    });
});

describe('resumen: fase actual y equipos eliminados', () => {
    it('formatCurrentPhase: grupo, ronda final y sin fases', () => {
        expect(formatCurrentPhase({ id: 1, name: 'Fase de grupos', type: 'GROUP', groupName: 'A' })).toBe('Fase de grupos · Grupo A');
        expect(formatCurrentPhase({ id: 2, name: 'Semis', type: 'FINAL', round: 'SEMI_FINAL' })).toBe('Semifinal');
        expect(formatCurrentPhase(null)).toBe('Sin fases');
    });

    it('formatEliminatedTeams: lista de nombres o mensaje vacío', () => {
        expect(formatEliminatedTeams([A, B])).toBe('Atlético Manizales, Deportivo Caldas');
        expect(formatEliminatedTeams([])).toBe('Ningún equipo eliminado');
    });
});
