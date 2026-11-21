import { EndpointRequirement } from '@/types/security';
import { SPORTS_PERMISSION_PREFIX } from './sports-api';

const TICKETS = `${SPORTS_PERMISSION_PREFIX}/tickets`;
const TICKETS_AVAILABILITY = `${SPORTS_PERMISSION_PREFIX}/tickets/availability`;
const MY_TICKETS = `${SPORTS_PERMISSION_PREFIX}/me/tickets`;

// Gestión administrativa de boletos (Administrador deportivo)
export const TICKETS_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: TICKETS, method: 'GET' }];

export const TICKET_CREATE_ENDPOINT: EndpointRequirement = { url: TICKETS, method: 'POST' };

export const TICKET_DELETE_ENDPOINT: EndpointRequirement = { url: `${TICKETS}/{id}`, method: 'DELETE' };

// Disponibilidad en vivo por localidad (Administrador deportivo y Aficionado)
export const TICKET_AVAILABILITY_ENDPOINT: EndpointRequirement = { url: TICKETS_AVAILABILITY, method: 'GET' };

// Boletos propios del aficionado autenticado (Aficionado)
export const MY_TICKETS_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: MY_TICKETS, method: 'GET' }];

export const MY_TICKET_PURCHASE_ENDPOINT: EndpointRequirement = { url: MY_TICKETS, method: 'POST' };

export const MY_TICKET_DELETE_ENDPOINT: EndpointRequirement = { url: `${MY_TICKETS}/{id}`, method: 'DELETE' };

