'use client';

import { useEffect, useMemo, useState } from 'react';
import { describeError } from '@/lib/api-errors';
import { listBalls, listFinalPhases, listGroupPhases, listGroupTeams, listRegistrations } from '@/lib/competition-api';
import { playableVenues } from '@/lib/match-form';
import { listTournamentVenues } from '@/lib/tournament-venues-api';
import { listTournaments } from '@/lib/tournaments-api';
import { listVenues } from '@/lib/venues-api';
import { Ball, Match, Tournament, TournamentVenue, Venue } from '@/types/sports';

export interface Option {
    label: string;
    value: number;
}

export interface PhaseOption extends Option {
    type: 'GROUP' | 'FINAL';
}

interface TournamentData {
    phases: PhaseOption[];
    venues: Venue[];
    tournamentVenues: TournamentVenue[];
    balls: Ball[];
    // Inscritos ACTIVE (para fases finales)
    registeredTeams: Option[];
}

const EMPTY_DATA: TournamentData = { phases: [], venues: [], tournamentVenues: [], balls: [], registeredTeams: [] };

/**
 * Opciones del formulario de partidos, en cascada: torneo → (fases,
 * escenarios habilitados, pelotas libres, inscritos) → equipos de la fase.
 * `editing` = partido que se edita: su pelota también se ofrece.
 */
export function useMatchFormOptions(visible: boolean, tournamentId: number | null, phaseId: number | null, editing: Match | null) {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [data, setData] = useState<TournamentData>(EMPTY_DATA);
    const [groupTeams, setGroupTeams] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Torneos que pueden programar partidos (no terminados ni cancelados)
    useEffect(() => {
        if (!visible) return;
        const controller = new AbortController();
        listTournaments({}, controller.signal)
            .then((all) => setTournaments(all.filter((tournament) => tournament.status !== 'FINISHED' && tournament.status !== 'CANCELLED')))
            .catch((cause) => !controller.signal.aborted && setError(describeError(cause)));
        return () => controller.abort();
    }, [visible]);

    useEffect(() => {
        if (!visible || tournamentId === null) {
            setData(EMPTY_DATA);
            return;
        }
        const controller = new AbortController();
        const signal = controller.signal;
        setLoading(true);
        setError(null);

        Promise.all([
            listGroupPhases({ tournamentId }, signal),
            listFinalPhases({ tournamentId }, signal),
            listVenues({ active: true }, signal),
            listTournamentVenues({ tournamentId }, signal),
            listBalls({ available: true }, signal),
            listRegistrations({ tournamentId, status: 'ACTIVE' }, signal)
        ])
            .then(([groups, finals, venues, tournamentVenues, balls, registrations]) =>
                setData({
                    phases: [...groups.map((group) => ({ label: `${group.name} · Grupo ${group.groupName}`, value: group.id, type: 'GROUP' as const })), ...finals.map((final) => ({ label: final.name, value: final.id, type: 'FINAL' as const }))],
                    venues,
                    tournamentVenues,
                    balls,
                    registeredTeams: registrations.map((registration) => ({ label: registration.team.name, value: registration.team.id }))
                })
            )
            .catch((cause) => !signal.aborted && setError(describeError(cause)))
            .finally(() => !signal.aborted && setLoading(false));

        return () => controller.abort();
    }, [visible, tournamentId]);

    const phaseType = data.phases.find((option) => option.value === phaseId)?.type ?? null;

    // En fase de grupos solo juegan los equipos del grupo
    useEffect(() => {
        if (!visible || phaseId === null || phaseType !== 'GROUP') {
            setGroupTeams([]);
            return;
        }
        const controller = new AbortController();
        listGroupTeams(phaseId, controller.signal)
            .then((teams) => setGroupTeams(teams.map((team) => ({ label: team.name, value: team.id }))))
            .catch((cause) => !controller.signal.aborted && setError(describeError(cause)));
        return () => controller.abort();
    }, [visible, phaseId, phaseType]);

    const teams = phaseType === 'GROUP' ? groupTeams : data.registeredTeams;

    const venues = useMemo(() => playableVenues(data.venues, data.tournamentVenues).map((venue) => ({ label: venue.parent ? `${venue.name} (en ${venue.parent.name})` : venue.name, value: venue.id })), [data]);

    const balls = useMemo(() => {
        const options = data.balls.map((ball) => ({ label: `${ball.brand} ${ball.model}${ball.size ? ` · talla ${ball.size}` : ''}`, value: ball.id }));
        if (editing && !options.some((option) => option.value === editing.ball.id)) options.unshift({ label: `${editing.ball.brand} ${editing.ball.model} (actual)`, value: editing.ball.id });
        return options;
    }, [data.balls, editing]);

    return {
        tournaments: tournaments.map((tournament) => ({ label: tournament.name, value: tournament.id })),
        phases: data.phases,
        teams,
        venues,
        balls,
        noEnabledVenues: tournamentId !== null && !loading && data.tournamentVenues.length === 0,
        loading,
        error
    };
}
