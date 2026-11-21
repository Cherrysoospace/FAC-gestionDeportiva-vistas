import { ActionResult } from '@/types/action';

/** Aviso (Toast) de la página del torneo: lo reutilizan los paneles de fases. */
export type PhaseNotify = (result: ActionResult, successText: string, errorSummary?: string) => void;

