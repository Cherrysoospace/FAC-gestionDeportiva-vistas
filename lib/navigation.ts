import { EndpointRequirement } from '@/types/security';
import { PERMISSIONS_VIEW_ENDPOINTS, ROLE_PERMISSIONS_VIEW_ENDPOINTS, ROLES_VIEW_ENDPOINTS, USERS_VIEW_ENDPOINTS } from './security-constants';
import { BETS_VIEW_ENDPOINTS, MY_BETS_VIEW_ENDPOINTS } from './bet-constants';
import { FANS_VIEW_ENDPOINTS, MY_FAN_VIEW_ENDPOINTS, MY_FAVORITE_TEAMS_VIEW_ENDPOINTS } from './fan-constants';
import { MATCHES_VIEW_ENDPOINTS } from './match-constants';
import { MY_PAYMENT_METHODS_VIEW_ENDPOINTS, PAYMENT_METHODS_VIEW_ENDPOINTS } from './payment-method-constants';
import { PLAYERS_VIEW_ENDPOINTS } from './player-constants';
import { TEAMS_VIEW_ENDPOINTS } from './team-constants';
import { MY_TICKETS_VIEW_ENDPOINTS, TICKETS_VIEW_ENDPOINTS } from './ticket-constants';
import { VENUES_VIEW_ENDPOINTS } from './venue-constants';

export interface AppModule {
    label: string;
    description: string;
    icon: string;
    to: string;
    section: 'Seguridad' | 'Gestión deportiva' | 'Cuenta';
    /** Endpoints que el usuario debe tener todos para ver el módulo. Vacío = cualquier usuario autenticado. */
    requiredEndpoints: EndpointRequirement[];
    /** Endpoints alternativos: si se cumple al menos uno, también habilita la entrada en el menú. */
    alternativeEndpoints?: EndpointRequirement[];
}

export const APP_MODULES: AppModule[] = [
    {
        label: 'Usuarios',
        description: 'Registra, edita y desactiva usuarios, y gestiona sus roles.',
        icon: 'pi-users',
        to: '/usuarios',
        section: 'Seguridad',
        requiredEndpoints: USERS_VIEW_ENDPOINTS
    },
    {
        label: 'Roles',
        description: 'Administra los roles del sistema y los usuarios asociados a cada rol.',
        icon: 'pi-shield',
        to: '/roles',
        section: 'Seguridad',
        requiredEndpoints: ROLES_VIEW_ENDPOINTS
    },
    {
        label: 'Asignar permisos',
        description: 'Define en la matriz qué puede hacer cada rol dentro del sistema.',
        icon: 'pi-lock',
        to: '/roles/permisos',
        section: 'Seguridad',
        requiredEndpoints: ROLE_PERMISSIONS_VIEW_ENDPOINTS
    },
    {
        label: 'Permisos',
        description: 'Gestiona el catálogo de permisos por recurso, método HTTP y operación.',
        icon: 'pi-key',
        to: '/permisos',
        section: 'Seguridad',
        requiredEndpoints: PERMISSIONS_VIEW_ENDPOINTS
    },
    {
        label: 'Torneos',
        description: 'Crea torneos y gestiona sus fases e inscripciones.',
        icon: 'pi-sitemap',
        to: '/torneos',
        section: 'Gestión deportiva',
        // Permiso de ms-sports, registrado en ms_security con el prefijo /gestion-deportiva
        requiredEndpoints: [{ url: '/gestion-deportiva/tournaments', method: 'GET' }]
    },
    {
        label: 'Equipos',
        description: 'Registra equipos, sus deportes y los equipos con los que se relacionan.',
        icon: 'pi-flag',
        to: '/equipos',
        section: 'Gestión deportiva',
        requiredEndpoints: TEAMS_VIEW_ENDPOINTS
    },
    {
        label: 'Escenarios',
        description: 'Gestiona los escenarios, sus espacios internos y las localidades con su capacidad.',
        icon: 'pi-building',
        to: '/escenarios',
        section: 'Gestión deportiva',
        requiredEndpoints: VENUES_VIEW_ENDPOINTS
    },
    {
        label: 'Jugadores',
        description: 'Registra jugadores y consulta su perfil deportivo: equipos, traspasos y habilidades.',
        icon: 'pi-id-card',
        to: '/jugadores',
        section: 'Gestión deportiva',
        requiredEndpoints: PLAYERS_VIEW_ENDPOINTS
    },
    {
        label: 'Partidos',
        description: 'Programa los partidos de cada fase y sigue su desarrollo en la pizarra.',
        icon: 'pi-calendar',
        to: '/partidos',
        section: 'Gestión deportiva',
        requiredEndpoints: MATCHES_VIEW_ENDPOINTS
    },
    {
        label: 'Aficionados',
        description: 'Administra los aficionados registrados y sus perfiles vinculados.',
        icon: 'pi-users',
        to: '/aficionados',
        section: 'Gestión deportiva',
        requiredEndpoints: FANS_VIEW_ENDPOINTS
    },
    {
        label: 'Mi perfil de aficionado',
        description: 'Registra o actualiza tu ficha de aficionado para comprar boletos y apostar.',
        icon: 'pi-id-card',
        to: '/mi-aficionado',
        section: 'Gestión deportiva',
        requiredEndpoints: MY_FAN_VIEW_ENDPOINTS
    },
    {
        label: 'Equipos favoritos',
        description: 'Elige tus equipos favoritos para recibir notificaciones de sus partidos.',
        icon: 'pi-heart',
        to: '/equipos-favoritos',
        section: 'Gestión deportiva',
        requiredEndpoints: MY_FAVORITE_TEAMS_VIEW_ENDPOINTS
    },
    {
        label: 'Métodos de pago',
        description: 'Administra el catálogo de medios de pago y gestiona tu billetera de aficionado.',
        icon: 'pi-credit-card',
        to: '/metodos-pago',
        section: 'Gestión deportiva',
        requiredEndpoints: PAYMENT_METHODS_VIEW_ENDPOINTS,
        alternativeEndpoints: MY_PAYMENT_METHODS_VIEW_ENDPOINTS
    },
    {
        label: 'Boletos',
        description: 'Consulta el aforo disponible por localidad y gestiona la compra de boletos.',
        icon: 'pi-ticket',
        to: '/boletos',
        section: 'Gestión deportiva',
        requiredEndpoints: TICKETS_VIEW_ENDPOINTS,
        alternativeEndpoints: MY_TICKETS_VIEW_ENDPOINTS
    },
    {
        label: 'Apuestas',
        description: 'Registra apuestas con cuota fija y consulta su estado y liquidación.',
        icon: 'pi-dollar',
        to: '/apuestas',
        section: 'Gestión deportiva',
        requiredEndpoints: BETS_VIEW_ENDPOINTS,
        alternativeEndpoints: MY_BETS_VIEW_ENDPOINTS
    },
    {
        label: 'Mi perfil',
        description: 'Consulta y actualiza tus datos personales y tu foto.',
        icon: 'pi-user',
        to: '/perfil',
        section: 'Cuenta',
        requiredEndpoints: []
    }
];

export type PermissionChecker = (url: string, method: string) => boolean;

export function canAccessModule(module: AppModule, hasPermissionUrl: PermissionChecker): boolean {
    if (module.requiredEndpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method))) {
        return true;
    }
    if (module.alternativeEndpoints && module.alternativeEndpoints.length > 0) {
        return module.alternativeEndpoints.some((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    }
    return false;
}

export function getAllowedModules(hasPermissionUrl: PermissionChecker): AppModule[] {
    return APP_MODULES.filter((module) => canAccessModule(module, hasPermissionUrl));
}
