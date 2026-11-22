'use client';

import { useMemo } from 'react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { TabPanel, TabView } from 'primereact/tabview';
import EmptyState from '@/components/ui/EmptyState';
import { formatDay } from '@/lib/tournament-labels';
import { finalRoundMatches, groupStageMatches, phaseTabLabel, splitPhases } from '@/lib/tournament-development-labels';
import { DevelopmentFinalRound, DevelopmentGroupStage, DevelopmentPhase } from '@/types/sports';
import { useTournamentDevelopment } from '../hooks/useTournamentDevelopment';
import DevelopmentBracket, { BracketRound } from './DevelopmentBracket';
import DevelopmentMatchesTable from './DevelopmentMatchesTable';
import DevelopmentStandingsTable from './DevelopmentStandingsTable';
import DevelopmentSummaryCards from './DevelopmentSummaryCards';

// HU-GC-08b: desarrollo del torneo (resumen, fases, posiciones, llaves, partidos y anotaciones).
// Solo lectura; los datos los calcula GET /tournaments/:id/development.
export default function TournamentDevelopmentPanel({ tournamentId }: { tournamentId: number }) {
    const { development, loading, error, reload } = useTournamentDevelopment(tournamentId);
    const finalRounds = useMemo(() => (development ? splitPhases(development.phases).finalRounds : []), [development]);

    if (error) {
        return (
            <div className="flex flex-column sm:flex-row sm:align-items-center gap-3">
                <Message severity="error" text={error} className="w-full" />
                <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
            </div>
        );
    }

    if (!development) {
        return loading ? <Skeleton height="18rem" /> : null;
    }

    return (
        <div className="flex flex-column gap-3">
            <div className="flex justify-content-end">
                <Button label="Actualizar" icon="pi pi-refresh" text loading={loading} onClick={reload} />
            </div>

            <DevelopmentSummaryCards summary={development.summary} />

            {development.phases.length === 0 ? (
                <EmptyState icon="pi-sitemap" title="Este torneo aún no tiene fases" description="Cuando se creen fases de grupos o fases finales, aquí se verán sus posiciones, llaves y partidos." />
            ) : (
                <>
                    {finalRounds.length > 0 && (
                        <section aria-label="Vista eliminatoria">
                            <h3 className="text-xl font-semibold text-900 mt-0 mb-3">Vista eliminatoria</h3>
                            <DevelopmentBracket rounds={finalRounds} />
                        </section>
                    )}

                    <TabView scrollable>
                        {development.phases.map((phase) => (
                            <TabPanel key={phaseKey(phase)} header={phaseTabLabel(phase)}>
                                {phase.type === 'GROUP' ? <GroupStageView stage={phase} /> : <FinalRoundView round={phase} />}
                            </TabPanel>
                        ))}
                    </TabView>
                </>
            )}
        </div>
    );
}

const phaseKey = (phase: DevelopmentPhase) => (phase.type === 'GROUP' ? `group-${phase.order}` : `final-${phase.id}`);

function PhaseDates({ startDate, endDate }: { startDate: string | null; endDate: string | null }) {
    if (!startDate && !endDate) return null;
    return (
        <p className="text-600 text-sm mt-0 mb-3">
            <i className="pi pi-calendar mr-2" aria-hidden="true" />
            {startDate ? formatDay(startDate) : 'Sin fecha'} – {endDate ? formatDay(endDate) : 'Sin fecha'}
        </p>
    );
}

function GroupStageView({ stage }: { stage: DevelopmentGroupStage }) {
    const matches = useMemo(() => groupStageMatches(stage), [stage]);
    return (
        <div>
            <PhaseDates startDate={stage.startDate} endDate={stage.endDate} />
            <h4 className="text-lg font-semibold text-900 mt-0 mb-2">Tablas de posiciones</h4>
            {stage.groups.length === 0 ? (
                <EmptyState icon="pi-th-large" title="Esta fase aún no tiene grupos" />
            ) : (
                <div className="grid">
                    {stage.groups.map((group) => (
                        <div key={group.id} className="col-12 xl:col-6">
                            <DevelopmentStandingsTable group={group} />
                        </div>
                    ))}
                </div>
            )}
            <div className="mt-3">
                <DevelopmentMatchesTable matches={matches} contextHeader="Grupo" />
            </div>
        </div>
    );
}

function FinalRoundView({ round }: { round: DevelopmentFinalRound }) {
    const matches = useMemo(() => finalRoundMatches(round), [round]);
    return (
        <div>
            <PhaseDates startDate={round.startDate} endDate={round.endDate} />
            <div className="mb-3" style={{ maxWidth: '24rem' }}>
                <BracketRound round={round} />
            </div>
            <DevelopmentMatchesTable matches={matches} contextHeader="Llave" />
        </div>
    );
}
