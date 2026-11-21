import { createResourceClient, sportsApiFetch, toQueryString } from './sports-api';
import {
    AvailableBetMatchesQuery,
    Bet,
    BetQuery,
    CancelBetPayload,
    CreateBetPayload,
    Match,
    MyBetQuery,
    PlaceBetPayload,
    UpdateMyBetPayload
} from '@/types/sports';

const betsClient = createResourceClient<Bet, CreateBetPayload, never, BetQuery>('/bets');

export const listBets = betsClient.list;
export const getBet = betsClient.getById;
export const createBet = betsClient.create;

export function listAvailableBetMatches(query: AvailableBetMatchesQuery = {}, signal?: AbortSignal): Promise<Match[]> {
    return sportsApiFetch<Match[]>(`/bets/available-matches${toQueryString({ ...query })}`, { signal });
}

export function voidBet(id: number, payload: CancelBetPayload = {}): Promise<Bet> {
    return sportsApiFetch<Bet>(`/bets/${id}/void`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}

const MY_BETS = '/me/bets';

export function listMyBets(query: MyBetQuery = {}, signal?: AbortSignal): Promise<Bet[]> {
    return sportsApiFetch<Bet[]>(`${MY_BETS}${toQueryString({ ...query })}`, { signal });
}

export function getMyBet(id: number, signal?: AbortSignal): Promise<Bet> {
    return sportsApiFetch<Bet>(`${MY_BETS}/${id}`, { signal });
}

export function placeMyBet(payload: PlaceBetPayload): Promise<Bet> {
    return sportsApiFetch<Bet>(MY_BETS, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function updateMyBet(id: number, payload: UpdateMyBetPayload): Promise<Bet> {
    return sportsApiFetch<Bet>(`${MY_BETS}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}

export function cancelMyBet(id: number, payload: CancelBetPayload = {}): Promise<Bet> {
    return sportsApiFetch<Bet>(`${MY_BETS}/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}

