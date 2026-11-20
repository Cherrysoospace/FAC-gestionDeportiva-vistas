/**
 * Tipos del microservicio ms-sports, copiados de sus DTO reales
 * (src/**\/dto/*.dto.ts y src/**\/enums/*.ts). Mismos nombres y nulabilidad.
 *
 * Fechas:
 * - "Fecha de día": string 'YYYY-MM-DD' (columnas date). Usar parseIsoDate/toIsoDate de lib/dates.ts.
 * - "Fecha y hora": string ISO 8601 (columnas datetime; el backend responde Date serializado).
 *   Para enviarlas, usar date.toISOString().
 */

// ---- Enums (uniones de strings) ----

export type TournamentStatus = 'PLANNED' | 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';

export type FinalRound = 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'THIRD_PLACE' | 'FINAL';

export type RegistrationStatus = 'ACTIVE' | 'WITHDRAWN';

export type TeamModality = 'MALE' | 'FEMALE' | 'MIXED';

export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';

// ---- Respuestas comunes ----

// Respuesta de los DELETE y de otras acciones sin cuerpo propio
export interface MessageResponse {
    message: string;
}

// ---- Deporte (sports/dto/sport-response.dto.ts) ----

export interface SportSummary {
    id: number;
    name: string;
    active: boolean;
}

export interface Sport {
    id: number;
    name: string;
    description: string | null;
    active: boolean;
    parent: SportSummary | null;
    // Solo en GET /sports/:id (relación cargada)
    subSports?: SportSummary[];
}

export interface CreateSportPayload {
    name: string;
    description?: string | null;
    // Ausente o null = deporte raíz
    parentId?: number | null;
}

export interface UpdateSportPayload {
    name?: string;
    description?: string | null;
    // undefined = no cambia; null = pasa a ser raíz
    parentId?: number | null;
    active?: boolean;
}

export interface SportQuery {
    parentId?: number;
    roots?: boolean;
    active?: boolean;
}

// ---- Pelota (balls/dto/ball-response.dto.ts) ----

export interface Ball {
    id: number;
    brand: string;
    model: string;
    size: string | null;
    active: boolean;
    // Partido al que está asignada; null = libre
    matchId: number | null;
}

export interface CreateBallPayload {
    brand: string;
    model: string;
    size?: string | null;
}

export interface UpdateBallPayload {
    brand?: string;
    model?: string;
    size?: string | null;
    active?: boolean;
}

export interface BallQuery {
    active?: boolean;
    // true = activas y sin partido asignado
    available?: boolean;
}

// ---- Torneo (tournaments/dto/tournament-response.dto.ts) ----

export interface TournamentSport {
    id: number;
    name: string;
}

export interface Tournament {
    id: number;
    name: string;
    sport: TournamentSport;
    // Fecha de día 'YYYY-MM-DD'
    startDate: string;
    // Fecha de día 'YYYY-MM-DD'
    endDate: string;
    // Fecha y hora ISO 8601
    registrationOpensAt: string;
    // Fecha y hora ISO 8601
    registrationClosesAt: string;
    status: TournamentStatus;
    active: boolean;
    // Inscripciones en estado ACTIVE
    registrationsCount: number;
    phasesCount: number;
}

export interface CreateTournamentPayload {
    name: string;
    sportId: number;
    // Fecha de día 'YYYY-MM-DD'
    startDate: string;
    // Fecha de día 'YYYY-MM-DD'
    endDate: string;
    // Fecha y hora ISO 8601 (toISOString())
    registrationOpensAt: string;
    // Fecha y hora ISO 8601 (toISOString())
    registrationClosesAt: string;
}

// Ningún campo acepta null (todas las columnas son NOT NULL)
export interface UpdateTournamentPayload {
    name?: string;
    sportId?: number;
    startDate?: string;
    endDate?: string;
    registrationOpensAt?: string;
    registrationClosesAt?: string;
    status?: TournamentStatus;
    active?: boolean;
}

export interface TournamentQuery {
    sportId?: number;
    status?: TournamentStatus;
    active?: boolean;
    // Texto parcial en el nombre
    search?: string;
}

// ---- Fases (phases/dto/*-response.dto.ts) ----

export interface PhaseTournament {
    id: number;
    name: string;
}

export interface GroupPhase {
    id: number;
    name: string;
    order: number;
    groupName: string;
    qualifiersCount: number | null;
    // Fecha de día 'YYYY-MM-DD'
    startDate: string | null;
    // Fecha de día 'YYYY-MM-DD'
    endDate: string | null;
    tournament: PhaseTournament;
    teamsCount: number;
    matchesCount: number;
}

// Equipo de un grupo (GET /group-phases/:id/teams)
export interface GroupTeam {
    id: number;
    name: string;
    city: string;
    modality: TeamModality;
}

export interface CreateGroupPhasePayload {
    tournamentId: number;
    name: string;
    order: number;
    // Se guarda en mayúsculas (ej. 'A')
    groupName: string;
    qualifiersCount?: number | null;
    startDate?: string | null;
    endDate?: string | null;
}

export interface UpdateGroupPhasePayload {
    name?: string;
    order?: number;
    groupName?: string;
    qualifiersCount?: number | null;
    startDate?: string | null;
    endDate?: string | null;
}

export interface GroupPhaseQuery {
    tournamentId?: number;
    order?: number;
}

export interface AssignGroupTeamPayload {
    teamId: number;
}

export interface FinalPhase {
    id: number;
    name: string;
    order: number;
    round: FinalRound;
    // Fecha de día 'YYYY-MM-DD'
    startDate: string | null;
    // Fecha de día 'YYYY-MM-DD'
    endDate: string | null;
    tournament: PhaseTournament;
    matchesCount: number;
}

export interface CreateFinalPhasePayload {
    tournamentId: number;
    name: string;
    order: number;
    round: FinalRound;
    startDate?: string | null;
    endDate?: string | null;
}

export interface UpdateFinalPhasePayload {
    name?: string;
    order?: number;
    round?: FinalRound;
    startDate?: string | null;
    endDate?: string | null;
}

export interface FinalPhaseQuery {
    tournamentId?: number;
}

// ---- Inscripción (registrations/dto/registration-response.dto.ts) ----

export interface RegistrationTournament {
    id: number;
    name: string;
}

export interface RegistrationTeam {
    id: number;
    name: string;
    city: string;
    modality: TeamModality;
}

export interface Registration {
    id: number;
    tournament: RegistrationTournament;
    team: RegistrationTeam;
    status: RegistrationStatus;
    // Fecha y hora ISO 8601
    registeredAt: string;
    // Fecha y hora ISO 8601
    withdrawnAt: string | null;
}

// Respuesta de POST /registrations (create-registrations-result.dto.ts)
export interface CreateRegistrationsResult {
    message: string;
    registrations: Registration[];
}

// Respuesta de PATCH /registrations/:id/withdraw
export interface WithdrawRegistrationResult {
    message: string;
    registration: Registration;
}

export interface CreateRegistrationPayload {
    tournamentId: number;
    // Uno o varios equipos (máx. 50, sin repetidos); todo o nada
    teamIds: number[];
}

export interface RegistrationQuery {
    tournamentId?: number;
    teamId?: number;
    status?: RegistrationStatus;
}

// ---- Equipo (teams/dto/team-response.dto.ts) ----

export interface TeamSportSummary {
    id: number;
    name: string;
}

export interface TeamGroup {
    id: number;
    groupName: string;
    tournamentId: number;
}

export interface Team {
    id: number;
    name: string;
    city: string;
    modality: TeamModality;
    active: boolean;
    // Deportes que juega (team_sports)
    sports: TeamSportSummary[];
    // Grupo actual; null = sin grupo
    group: TeamGroup | null;
    // Inscripciones en estado ACTIVE
    activeRegistrationsCount: number;
    // Jugadores con contrato vigente hoy
    playersCount: number;
}

export interface CreateTeamPayload {
    name: string;
    city: string;
    modality: TeamModality;
}

export interface UpdateTeamPayload {
    name?: string;
    city?: string;
    modality?: TeamModality;
    active?: boolean;
}

export interface TeamQuery {
    search?: string;
    modality?: TeamModality;
    active?: boolean;
    sportId?: number;
}

// ---- Equipo-Deporte (team-sports/dto/team-sport-response.dto.ts) ----

export interface TeamSportTeam {
    id: number;
    name: string;
    city: string;
    modality: TeamModality;
}

export interface TeamSportAssociation {
    id: number;
    team: TeamSportTeam;
    sport: TeamSportSummary;
}

export interface CreateTeamSportPayload {
    teamId: number;
    sportId: number;
}

export interface TeamSportQuery {
    teamId?: number;
    sportId?: number;
}

// ---- Equipo-Equipo (team-relations/dto/related-team-response.dto.ts) ----

export interface RelatedTeam {
    id: number;
    name: string;
    city: string;
    modality: TeamModality;
    active: boolean;
}

export interface CreateTeamRelationPayload {
    relatedTeamId: number;
}

// Respuesta de POST /teams/:id/related-teams
export interface CreateTeamRelationResult {
    message: string;
    relatedTeams: RelatedTeam[];
}

// ---- Escenario (venues/dto/venue-response.dto.ts) ----

export interface VenueParent {
    id: number;
    name: string;
}

export interface VenueChild {
    id: number;
    name: string;
    active: boolean;
}

export interface Venue {
    id: number;
    name: string;
    address: string | null;
    active: boolean;
    // null = escenario principal
    parent: VenueParent | null;
    // Solo en GET /venues/:id (relación cargada)
    children?: VenueChild[];
    // Localidades del escenario (activas e inactivas)
    locationsCount: number;
    // Suma de la capacidad de las localidades activas
    totalCapacity: number;
}

export interface CreateVenuePayload {
    name: string;
    address?: string | null;
    // Ausente o null = escenario principal
    parentId?: number | null;
}

export interface UpdateVenuePayload {
    name?: string;
    address?: string | null;
    // undefined = no cambia; null = pasa a ser principal
    parentId?: number | null;
    active?: boolean;
}

export interface VenueQuery {
    search?: string;
    parentId?: number;
    // true = solo escenarios principales
    roots?: boolean;
    active?: boolean;
}

// ---- Localidad (locations/dto/location-response.dto.ts) ----

export interface LocationVenue {
    id: number;
    name: string;
}

export interface Location {
    id: number;
    name: string;
    capacity: number;
    active: boolean;
    venue: LocationVenue;
}

export interface CreateLocationPayload {
    venueId: number;
    name: string;
    capacity: number;
}

// El escenario no se puede cambiar
export interface UpdateLocationPayload {
    name?: string;
    capacity?: number;
    active?: boolean;
}

export interface LocationQuery {
    venueId?: number;
    active?: boolean;
}

// ---- Jugador (players/dto/player-response.dto.ts) ----

export type DominantFoot = 'RIGHT' | 'LEFT' | 'BOTH';

export interface PlayerTeamSummary {
    id: number;
    name: string;
}

export interface Player {
    id: number;
    fullName: string;
    // Sin puntos ni espacios (el backend lo normaliza)
    documentNumber: string;
    // Fecha de día 'YYYY-MM-DD'
    birthDate: string;
    // Calculada a partir de birthDate
    age: number;
    nationality: string;
    position: string;
    heightCm: number;
    dominantFoot: DominantFoot | null;
    active: boolean;
    // Equipos con contrato vigente hoy; vacío = sin equipo
    currentTeams: PlayerTeamSummary[];
}

export interface CreatePlayerPayload {
    fullName: string;
    documentNumber: string;
    birthDate: string;
    nationality: string;
    position: string;
    heightCm: number;
    dominantFoot?: DominantFoot | null;
}

export interface UpdatePlayerPayload {
    fullName?: string;
    documentNumber?: string;
    birthDate?: string;
    nationality?: string;
    position?: string;
    heightCm?: number;
    // null = no aplica
    dominantFoot?: DominantFoot | null;
    active?: boolean;
}

export interface PlayerQuery {
    // Nombre o documento
    search?: string;
    active?: boolean;
    // Contrato vigente en ese equipo
    teamId?: number;
    // Contrato vigente en un equipo de ese deporte
    sportId?: number;
}

// ---- Equipo-Jugador (team-players/dto/team-player-response.dto.ts) ----

export type ContractStatus = 'ACTIVE' | 'RELEASED';

// Calculado: CURRENT = vigente hoy; UPCOMING = aún no empieza; PAST = retirado o vencido
export type ContractStage = 'CURRENT' | 'UPCOMING' | 'PAST';

export type ReleaseReason = 'TRANSFERRED' | 'CONTRACT_ENDED' | 'TERMINATED';

export interface TeamPlayerTeam {
    id: number;
    name: string;
    city: string;
    modality: TeamModality;
}

export interface TeamPlayerPlayer {
    id: number;
    fullName: string;
    documentNumber: string;
    position: string;
    age: number;
}

export interface TeamPlayer {
    id: number;
    team: TeamPlayerTeam;
    player: TeamPlayerPlayer;
    // Fechas de día 'YYYY-MM-DD'
    startDate: string;
    endDate: string;
    status: ContractStatus;
    stage: ContractStage;
    // Solo en contratos RELEASED
    releaseDate: string | null;
    releaseReason: ReleaseReason | null;
}

export interface CreateTeamPlayerPayload {
    teamId: number;
    playerId: number;
    startDate: string;
    endDate: string;
}

// Solo contratos vigentes; el equipo y el jugador no cambian
export interface UpdateTeamPlayerPayload {
    startDate?: string;
    endDate?: string;
}

export interface ReleaseTeamPlayerPayload {
    reason: ReleaseReason;
    // Ausente = hoy (o el fin del contrato si ya venció)
    releaseDate?: string;
}

// Respuesta de PATCH /team-players/:id/release
export interface ReleaseTeamPlayerResult {
    message: string;
    contract: TeamPlayer;
}

export interface TeamPlayerQuery {
    teamId?: number;
    playerId?: number;
    status?: ContractStatus;
    stage?: ContractStage;
}

// ---- Habilidad (skills/dto/skill-response.dto.ts) ----

export type SkillCategory = 'PHYSICAL' | 'TECHNICAL' | 'TACTICAL' | 'MENTAL';

export interface Skill {
    id: number;
    name: string;
    category: SkillCategory;
    description: string;
}

export interface SkillQuery {
    search?: string;
    category?: SkillCategory;
}

// ---- Habilidad-Jugador (player-skills/dto/player-skill-response.dto.ts) ----

export interface PlayerSkillPlayer {
    id: number;
    fullName: string;
    position: string;
}

export interface PlayerSkill {
    id: number;
    player: PlayerSkillPlayer;
    skill: Skill;
    // 1 a 100
    level: number;
}

export interface CreatePlayerSkillPayload {
    playerId: number;
    skillId: number;
    level: number;
}

export interface UpdatePlayerSkillPayload {
    level: number;
}

export interface PlayerSkillQuery {
    playerId?: number;
    skillId?: number;
}

// ---- Perfil del jugador (player-profiles/dto/player-profile-response.dto.ts) ----

// Listas vacías = "sin equipos" / "sin habilidades"
export interface PlayerProfile {
    player: Player;
    currentTeams: TeamPlayer[];
    upcomingTeams: TeamPlayer[];
    // Retirados o vencidos, del más reciente al más antiguo
    teamHistory: TeamPlayer[];
    skills: PlayerSkill[];
}
