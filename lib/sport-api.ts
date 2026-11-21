import { createResourceClient } from './sports-api';
import { CreateSportPayload, Sport, SportQuery, UpdateSportPayload } from '@/types/sports';

// CRUD de deportes (GET/POST /sports, GET/PATCH/DELETE /sports/:id).
// El listado de solo lectura para selectores sigue en sports-catalog-api.ts.
export const sportsClient = createResourceClient<Sport, CreateSportPayload, UpdateSportPayload, SportQuery>('/sports');

