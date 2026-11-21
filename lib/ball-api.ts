import { createResourceClient } from './sports-api';
import { Ball, BallQuery, CreateBallPayload, UpdateBallPayload } from '@/types/sports';

// CRUD de pelotas (GET/POST /balls, GET/PATCH/DELETE /balls/:id).
// El listado de solo lectura para selectores sigue en competition-api.ts.
export const ballsClient = createResourceClient<Ball, CreateBallPayload, UpdateBallPayload, BallQuery>('/balls');

