import { Tag } from 'primereact/tag';
import { RegistrationWindow, tournamentStatusDisplay } from '@/lib/tournament-labels';

// Con estado REGISTRATION_OPEN también mira las fechas: si el periodo ya venció dice "Inscripciones cerradas".
export function TournamentStatusTag({ tournament }: { tournament: RegistrationWindow }) {
    const { label, severity } = tournamentStatusDisplay(tournament);
    return <Tag value={label} severity={severity} />;
}

export function TournamentActiveTag({ active }: { active: boolean }) {
    return active ? <Tag value="Activo" severity="success" /> : <Tag value="Inactivo" severity="danger" />;
}
