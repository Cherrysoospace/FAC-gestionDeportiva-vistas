import { createResourceClient } from './sports-api';
import { CreateSkillPayload, Skill, SkillQuery, UpdateSkillPayload } from '@/types/sports';

// CRUD del catálogo de habilidades (GET/POST /skills, GET/PATCH/DELETE /skills/:id).
// El listado de solo lectura para selectores sigue en skills-api.ts.
export const skillsClient = createResourceClient<Skill, CreateSkillPayload, UpdateSkillPayload, SkillQuery>('/skills');

