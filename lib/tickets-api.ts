import { createResourceClient, sportsApiFetch, toQueryString } from './sports-api';
import {
    CreateTicketPayload,
    MatchTicketAvailability,
    MessageResponse,
    MyTicketQuery,
    PurchaseTicketPayload,
    Ticket,
    TicketQuery
} from '@/types/sports';

const ticketsClient = createResourceClient<Ticket, CreateTicketPayload, never, TicketQuery>('/tickets');

export const listTickets = ticketsClient.list;
export const getTicket = ticketsClient.getById;
export const createTicket = ticketsClient.create;
export const deleteTicket = ticketsClient.remove;

export function getMatchTicketAvailability(matchId: number, signal?: AbortSignal): Promise<MatchTicketAvailability> {
    return sportsApiFetch<MatchTicketAvailability>(`/tickets/availability${toQueryString({ matchId })}`, { signal });
}

const MY_TICKETS = '/me/tickets';

export function listMyTickets(query: MyTicketQuery = {}, signal?: AbortSignal): Promise<Ticket[]> {
    return sportsApiFetch<Ticket[]>(`${MY_TICKETS}${toQueryString({ ...query })}`, { signal });
}

export function getMyTicket(id: number, signal?: AbortSignal): Promise<Ticket> {
    return sportsApiFetch<Ticket>(`${MY_TICKETS}/${id}`, { signal });
}

export function purchaseMyTicket(payload: PurchaseTicketPayload): Promise<Ticket> {
    return sportsApiFetch<Ticket>(MY_TICKETS, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function deleteMyTicket(id: number): Promise<MessageResponse> {
    return sportsApiFetch<MessageResponse>(`${MY_TICKETS}/${id}`, {
        method: 'DELETE'
    });
}

