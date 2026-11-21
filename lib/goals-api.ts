import { createResourceClient } from './sports-api';
import { CreateGoalPayload, Goal, GoalQuery, UpdateGoalPayload } from '@/types/sports';

const goalsClient = createResourceClient<Goal, CreateGoalPayload, UpdateGoalPayload, GoalQuery>('/goals');

export const listGoals = goalsClient.list;
export const getGoal = goalsClient.getById;
export const createGoal = goalsClient.create;
export const updateGoal = goalsClient.update;
export const deleteGoal = goalsClient.remove;
