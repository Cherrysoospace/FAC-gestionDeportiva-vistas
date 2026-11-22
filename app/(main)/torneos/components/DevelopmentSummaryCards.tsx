import { ProgressBar } from 'primereact/progressbar';
import StatCard from '@/components/ui/StatCard';
import { formatCurrentPhase, formatEliminatedTeams, formatPercentage } from '@/lib/tournament-development-labels';
import { DevelopmentSummary } from '@/types/sports';

// Tarjetas de resumen del desarrollo (HU-GC-08b): equipos, partidos, avance y anotaciones.
export default function DevelopmentSummaryCards({ summary }: { summary: DevelopmentSummary }) {
    const cards: [string, number, string][] = [
        ['Equipos', summary.teams, 'pi-users'],
        ['Partidos', summary.matches, 'pi-calendar'],
        ['Finalizados', summary.finishedMatches, 'pi-check-circle'],
        ['Pendientes', summary.pendingMatches, 'pi-clock'],
        ['Cancelados', summary.cancelledMatches, 'pi-ban'],
        ['Anotaciones', summary.goals, 'pi-star']
    ];

    return (
        <div className="grid mb-3">
            <div className="col-12 md:col-6">
                <StatCard label="Fase actual" value={formatCurrentPhase(summary.currentPhase)} icon="pi-flag" />
            </div>
            <div className="col-12 md:col-6">
                <StatCard label={`Equipos eliminados (${summary.eliminatedTeams.length})`} value={<span className="text-base font-normal">{formatEliminatedTeams(summary.eliminatedTeams)}</span>} icon="pi-times-circle" />
            </div>
            {cards.map(([label, value, icon]) => (
                <div key={label} className="col-6 md:col-4 xl:col-2">
                    <StatCard label={label} value={value} icon={icon} />
                </div>
            ))}
            <div className="col-12">
                <div className="flex justify-content-between align-items-center mb-2">
                    <span className="text-600 text-sm">Torneo completado (partidos con resultado sobre los no cancelados)</span>
                    <span className="text-900 font-bold">{formatPercentage(summary.completionPercentage)}</span>
                </div>
                <ProgressBar value={summary.completionPercentage} showValue={false} style={{ height: '0.6rem' }} aria-label="Porcentaje del torneo completado" />
            </div>
        </div>
    );
}
