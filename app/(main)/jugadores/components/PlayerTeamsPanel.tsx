import Link from 'next/link';
import { Tag } from 'primereact/tag';
import EmptyState from '@/components/ui/EmptyState';
import { CONTRACT_STAGE_LABELS, CONTRACT_STAGE_SEVERITY, RELEASE_REASON_LABELS } from '@/lib/player-labels';
import { formatDay } from '@/lib/tournament-labels';
import { PlayerProfile, TeamPlayer } from '@/types/sports';

interface PlayerTeamsPanelProps {
    profile: PlayerProfile;
    /** El usuario puede abrir el detalle del equipo */
    canViewTeam: boolean;
}

// HU-GD-08: equipos con los que está asociado el jugador, o el aviso de que no tiene.
export default function PlayerTeamsPanel({ profile, canViewTeam }: PlayerTeamsPanelProps) {
    const { currentTeams, upcomingTeams, teamHistory } = profile;

    if (currentTeams.length + upcomingTeams.length + teamHistory.length === 0) {
        return <EmptyState icon="pi-flag" title="El jugador no tiene equipos asociados." description="Asígnalo desde la plantilla de un equipo." />;
    }

    return (
        <div className="flex flex-column gap-4">
            <TeamSection title="Equipo actual" contracts={currentTeams} canViewTeam={canViewTeam} empty="No tiene contrato vigente con ningún equipo." />
            {upcomingTeams.length > 0 && <TeamSection title="Próximos contratos" contracts={upcomingTeams} canViewTeam={canViewTeam} />}
            <TeamSection title="Historial de traspasos" contracts={teamHistory} canViewTeam={canViewTeam} empty="Sin equipos anteriores." />
        </div>
    );
}

function TeamSection({ title, contracts, canViewTeam, empty }: { title: string; contracts: TeamPlayer[]; canViewTeam: boolean; empty?: string }) {
    return (
        <div>
            <h6 className="mt-0 mb-2">{title}</h6>
            {contracts.length === 0 ? (
                <p className="text-600 m-0">{empty}</p>
            ) : (
                <ul className="list-none p-0 m-0">
                    {contracts.map((contract) => (
                        <li key={contract.id} className="flex flex-column md:flex-row md:align-items-center justify-content-between gap-2 py-2 border-bottom-1 surface-border">
                            <div className="flex flex-column">
                                {canViewTeam ? (
                                    <Link href={`/equipos/${contract.team.id}`} className="text-900 font-medium">
                                        {contract.team.name}
                                    </Link>
                                ) : (
                                    <span className="text-900 font-medium">{contract.team.name}</span>
                                )}
                                <span className="text-600 text-sm">
                                    {formatDay(contract.startDate)} – {formatDay(contract.releaseDate ?? contract.endDate)}
                                    {contract.releaseReason && ` · ${RELEASE_REASON_LABELS[contract.releaseReason]}`}
                                </span>
                            </div>
                            <Tag value={CONTRACT_STAGE_LABELS[contract.stage]} severity={CONTRACT_STAGE_SEVERITY[contract.stage]} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
