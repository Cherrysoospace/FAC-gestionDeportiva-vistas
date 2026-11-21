import { describe, expect, it } from 'vitest';
import { APP_MODULES, getAllowedModules } from './navigation';

describe('getAllowedModules', () => {
    it('muestra solo Mi perfil cuando el usuario no tiene permisos', () => {
        const allowed = getAllowedModules(() => false);

        expect(allowed.map((module) => module.to)).toEqual(['/perfil']);
    });

    it('muestra todos los módulos cuando el usuario tiene todos los permisos', () => {
        const allowed = getAllowedModules(() => true);

        expect(allowed).toHaveLength(APP_MODULES.length);
    });

    it('exige todos los endpoints del módulo, no solo uno', () => {
        const allowed = getAllowedModules((url, method) => url === '/api/roles' && method === 'GET');

        expect(allowed.map((module) => module.to)).not.toContain('/roles/permisos');
    });

    it('muestra Torneos con el permiso GET de ms-sports', () => {
        const allowed = getAllowedModules((url, method) => url === '/gestion-deportiva/tournaments' && method === 'GET');

        expect(allowed.map((module) => module.to)).toEqual(['/torneos', '/perfil']);
        expect(allowed.find((module) => module.to === '/torneos')?.section).toBe('Gestión deportiva');
    });

    it('muestra Equipos y Escenarios solo con su permiso GET de ms-sports', () => {
        const allowed = getAllowedModules((url, method) => method === 'GET' && ['/gestion-deportiva/teams', '/gestion-deportiva/venues'].includes(url));

        expect(allowed.map((module) => module.to)).toEqual(['/equipos', '/escenarios', '/perfil']);
    });

    it('muestra Jugadores con GET /gestion-deportiva/players', () => {
        const allowed = getAllowedModules((url, method) => method === 'GET' && url === '/gestion-deportiva/players');

        expect(allowed.map((module) => module.to)).toEqual(['/jugadores', '/perfil']);
    });

    it('muestra Partidos con GET /gestion-deportiva/matches', () => {
        const allowed = getAllowedModules((url, method) => method === 'GET' && url === '/gestion-deportiva/matches');

        expect(allowed.map((module) => module.to)).toEqual(['/partidos', '/perfil']);
    });

    it('muestra Aficionados solo al rol con GET /gestion-deportiva/fans', () => {
        const allowed = getAllowedModules((url, method) => method === 'GET' && url === '/gestion-deportiva/fans');

        expect(allowed.map((module) => module.to)).toEqual(['/aficionados', '/perfil']);
        expect(allowed.map((module) => module.to)).not.toContain('/mi-aficionado');
        expect(allowed.map((module) => module.to)).not.toContain('/equipos-favoritos');
    });

    it('muestra Mi perfil de aficionado y Equipos favoritos al Aficionado sin mostrar Aficionados', () => {
        const allowed = getAllowedModules(
            (url, method) =>
                method === 'GET' && ['/gestion-deportiva/me/fan', '/gestion-deportiva/me/favorite-teams'].includes(url)
        );

        expect(allowed.map((module) => module.to)).toEqual(['/mi-aficionado', '/equipos-favoritos', '/perfil']);
        expect(allowed.map((module) => module.to)).not.toContain('/aficionados');
    });

    it('muestra Métodos de pago con permiso de catálogo o de billetera propia', () => {
        const asAdmin = getAllowedModules((url, method) => method === 'GET' && url === '/gestion-deportiva/payment-methods');
        const asFan = getAllowedModules((url, method) => method === 'GET' && url === '/gestion-deportiva/me/payment-methods');

        expect(asAdmin.map((module) => module.to)).toEqual(['/metodos-pago', '/perfil']);
        expect(asFan.map((module) => module.to)).toEqual(['/metodos-pago', '/perfil']);
    });
});
