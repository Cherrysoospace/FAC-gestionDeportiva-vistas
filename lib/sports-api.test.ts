import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./session', () => ({
    getStoredSession: () => ({ token: 'token-de-prueba' }),
    clearSession: vi.fn()
}));

import { createResourceClient, sportsApiFetch, toQueryString } from './sports-api';

describe('toQueryString', () => {
    it('omite los valores undefined', () => {
        expect(toQueryString({ tournamentId: 1, status: undefined })).toBe('?tournamentId=1');
    });

    it("omite '' y conserva false", () => {
        expect(toQueryString({ search: '', active: false })).toBe('?active=false');
    });

    it("devuelve '' cuando no hay parámetros", () => {
        expect(toQueryString({})).toBe('');
    });

    it('omite null y conserva 0', () => {
        expect(toQueryString({ parentId: null, order: 0 })).toBe('?order=0');
    });
});

describe('sportsApiFetch', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('llama a ms-sports con el prefijo /gestion-deportiva y el token', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        vi.stubGlobal('fetch', fetchMock);

        await sportsApiFetch('/tournaments?status=PLANNED');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe('http://localhost:3001/gestion-deportiva/tournaments?status=PLANNED');
        expect(new Headers(init.headers).get('Authorization')).toBe('Bearer token-de-prueba');
        expect(init).not.toHaveProperty('baseUrl');
    });
});

describe('createResourceClient', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('construye las rutas CRUD estándar con filtros, cuerpo y método HTTP correcto', async () => {
        const fetchMock = vi.fn().mockImplementation(() =>
            Promise.resolve(new Response(JSON.stringify({ id: 7 }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
        );
        vi.stubGlobal('fetch', fetchMock);

        const client = createResourceClient<{ id: number }, { name: string }, { active: boolean }, { active?: boolean }>('fans/');

        await client.list({ active: true });
        await client.getById(7);
        await client.create({ name: 'Ana' });
        await client.update(7, { active: false });
        await client.remove(7);

        expect(fetchMock).toHaveBeenCalledTimes(5);
        expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3001/gestion-deportiva/fans?active=true');
        expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:3001/gestion-deportiva/fans/7');
        expect(fetchMock.mock.calls[2][0]).toBe('http://localhost:3001/gestion-deportiva/fans');
        expect((fetchMock.mock.calls[2][1] as RequestInit).method).toBe('POST');
        expect((fetchMock.mock.calls[2][1] as RequestInit).body).toBe(JSON.stringify({ name: 'Ana' }));
        expect(fetchMock.mock.calls[3][0]).toBe('http://localhost:3001/gestion-deportiva/fans/7');
        expect((fetchMock.mock.calls[3][1] as RequestInit).method).toBe('PATCH');
        expect(fetchMock.mock.calls[4][0]).toBe('http://localhost:3001/gestion-deportiva/fans/7');
        expect((fetchMock.mock.calls[4][1] as RequestInit).method).toBe('DELETE');
    });
});
