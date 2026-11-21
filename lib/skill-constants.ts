import { EndpointRequirement } from '@/types/security';
import { SPORTS_PERMISSION_PREFIX } from './sports-api';
import { SkillCategory } from '@/types/sports';

// Permisos de ms-sports (SportsPermissionSeeds: crud("/skills", "Habilidades"))
const SKILLS = `${SPORTS_PERMISSION_PREFIX}/skills`;

export const SKILLS_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: SKILLS, method: 'GET' }];

export const SKILL_CREATE_ENDPOINT: EndpointRequirement = { url: SKILLS, method: 'POST' };

export const SKILL_UPDATE_ENDPOINT: EndpointRequirement = { url: `${SKILLS}/{id}`, method: 'PATCH' };

export const SKILL_DELETE_ENDPOINT: EndpointRequirement = { url: `${SKILLS}/{id}`, method: 'DELETE' };

// Categorías de SkillCategory (skills/enums/skill-category.enum.ts)
export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
    PHYSICAL: 'Física',
    TECHNICAL: 'Técnica',
    TACTICAL: 'Táctica',
    MENTAL: 'Mental'
};

export const SKILL_CATEGORY_SEVERITY: Record<SkillCategory, 'success' | 'info' | 'warning' | 'danger'> = {
    PHYSICAL: 'danger',
    TECHNICAL: 'info',
    TACTICAL: 'warning',
    MENTAL: 'success'
};

export const SKILL_CATEGORY_OPTIONS = (Object.keys(SKILL_CATEGORY_LABELS) as SkillCategory[]).map((category) => ({ label: SKILL_CATEGORY_LABELS[category], value: category }));

