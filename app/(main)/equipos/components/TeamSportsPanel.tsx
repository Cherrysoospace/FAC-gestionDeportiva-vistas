'use client';

import { useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import EmptyState from '@/components/ui/EmptyState';
import SearchInput from '@/components/ui/SearchInput';
import { Sport, TeamSportAssociation } from '@/types/sports';

interface TeamSportsPanelProps {
    associations: TeamSportAssociation[];
    /** Deportes activos (GET /sports?active=true) */
    sports: Sport[];
    loading: boolean;
    error: string | null;
    canAssociate: boolean;
    canRemove: boolean;
    onAssociate: (sport: Sport) => Promise<void>;
    onRemove: (association: TeamSportAssociation) => Promise<void>;
}

// HU-GD-03: deportes disponibles a la izquierda y asociados a la derecha.
export default function TeamSportsPanel({ associations, sports, loading, error, canAssociate, canRemove, onAssociate, onRemove }: TeamSportsPanelProps) {
    const [search, setSearch] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);

    const associatedIds = useMemo(() => new Set(associations.map((association) => association.sport.id)), [associations]);
    const available = useMemo(() => {
        const term = search.trim().toLowerCase();
        return sports.filter((sport) => !associatedIds.has(sport.id) && sport.name.toLowerCase().includes(term));
    }, [sports, associatedIds, search]);

    // Evita doble clic mientras responde el backend
    const run = async (key: string, action: () => Promise<void>) => {
        setBusyId(key);
        await action();
        setBusyId(null);
    };

    if (error) return <Message severity="error" text={error} className="w-full" />;

    return (
        <div className="grid">
            {canAssociate && (
                <div className="col-12 lg:col-6">
                    <h6 className="mt-0">Deportes disponibles</h6>
                    <SearchInput value={search} onChange={setSearch} ariaLabel="Buscar deportes disponibles" placeholder="Buscar deportes" className="w-full mb-3" />
                    {available.length === 0 ? (
                        <EmptyState icon="pi-check-circle" title={search.trim() ? 'Ningún deporte coincide con la búsqueda.' : 'El equipo ya juega todos los deportes activos.'} />
                    ) : (
                        <div className="grid">
                            {available.map((sport) => (
                                <div key={sport.id} className="col-12 sm:col-6">
                                    <div className="surface-border border-1 border-round p-3 flex align-items-center justify-content-between gap-2">
                                        <span className="font-medium text-900">{sport.name}</span>
                                        <Button label="Asociar" icon="pi pi-plus" size="small" outlined loading={busyId === `add-${sport.id}`} disabled={busyId !== null} onClick={() => run(`add-${sport.id}`, () => onAssociate(sport))} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <small className="text-600 block mt-2">Asocia los deportes en los que el equipo puede competir. Solo se puede inscribir en torneos de esos deportes.</small>
                </div>
            )}

            <div className={canAssociate ? 'col-12 lg:col-6' : 'col-12'}>
                <h6 className="mt-0">
                    Deportes asociados <span className="text-600 font-normal">({associations.length})</span>
                </h6>
                {loading ? (
                    <Skeleton height="6rem" />
                ) : associations.length === 0 ? (
                    <EmptyState icon="pi-link" title="El equipo no tiene deportes asociados." />
                ) : (
                    <ul className="list-none p-0 m-0">
                        {associations.map((association) => (
                            <li key={association.id} className="flex align-items-center justify-content-between py-2 border-bottom-1 surface-border">
                                <span className="text-900 font-medium">{association.sport.name}</span>
                                {canRemove && (
                                    <Button
                                        label="Retirar asociación"
                                        icon="pi pi-times"
                                        size="small"
                                        text
                                        severity="danger"
                                        loading={busyId === `remove-${association.id}`}
                                        disabled={busyId !== null}
                                        onClick={() => run(`remove-${association.id}`, () => onRemove(association))}
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                )}
                {canRemove && <small className="text-600 block mt-2">Retirar la asociación no borra el equipo ni el deporte. No se puede si el equipo está inscrito en un torneo en curso de ese deporte.</small>}
            </div>
        </div>
    );
}
