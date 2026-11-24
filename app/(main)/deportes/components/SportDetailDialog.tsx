'use client';

import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import ActiveTag from '@/components/ui/ActiveTag';
import { describeError } from '@/lib/api-errors';
import { sportsClient } from '@/lib/sport-api';
import { listTeamSports } from '@/lib/team-sports-api';
import { Sport, TeamSportAssociation } from '@/types/sports';

interface SportDetailDialogProps {
    sportId: number | null;
    canListTeams: boolean;
    onHide: () => void;
}

// HU-GD-01 #5: información detallada de un deporte (GET /sports/:id) con sus equipos (GET /team-sports?sportId=).
export default function SportDetailDialog({ sportId, canListTeams, onHide }: SportDetailDialogProps) {
    const [sport, setSport] = useState<Sport | null>(null);
    const [teams, setTeams] = useState<TeamSportAssociation[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (sportId === null) return;
        const controller = new AbortController();
        setSport(null);
        setTeams(null);
        setError(null);
        Promise.all([sportsClient.getById(sportId, controller.signal), canListTeams ? listTeamSports({ sportId }, controller.signal) : Promise.resolve(null)])
            .then(([loadedSport, loadedTeams]) => {
                setSport(loadedSport);
                setTeams(loadedTeams);
            })
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            });
        return () => controller.abort();
    }, [sportId, canListTeams]);

    const subSports = sport?.subSports ?? [];

    return (
        <Dialog header={sport ? sport.name : 'Detalle del deporte'} visible={sportId !== null} onHide={onHide} style={{ width: '40rem' }} breakpoints={{ '640px': '95vw' }} modal>
            {error && <Message severity="error" text={error} className="w-full" />}
            {!error && !sport && <Skeleton height="8rem" />}
            {!error && sport && (
                <div className="flex flex-column gap-3">
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <div className="text-600 text-sm mb-1">Estado</div>
                            <ActiveTag active={sport.active} />
                        </div>
                        <div className="col-12 md:col-6">
                            <div className="text-600 text-sm mb-1">Deporte padre</div>
                            {sport.parent ? <Tag value={sport.parent.name} severity="info" /> : <span className="text-900">Deporte raíz</span>}
                        </div>
                        <div className="col-12">
                            <div className="text-600 text-sm mb-1">Descripción</div>
                            <div className="text-900">{sport.description ?? <span className="text-500">Sin descripción</span>}</div>
                        </div>
                    </div>
                    <div>
                        <h6 className="mb-2">Subdeportes ({subSports.length})</h6>
                        {subSports.length === 0 ? (
                            <span className="text-500">Este deporte no tiene subdeportes.</span>
                        ) : (
                            <div className="flex flex-wrap gap-1">
                                {subSports.map((sub) => (
                                    <Tag key={sub.id} value={sub.name} severity="success" />
                                ))}
                            </div>
                        )}
                    </div>
                    {teams && (
                        <div>
                            <h6 className="mb-2">Equipos que lo practican ({teams.length})</h6>
                            {teams.length === 0 ? (
                                <span className="text-500">Ningún equipo está asociado a este deporte.</span>
                            ) : (
                                <ul className="m-0 pl-3">
                                    {teams.map((association) => (
                                        <li key={association.id}>
                                            {association.team.name} <span className="text-600">· {association.team.city}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Dialog>
    );
}
