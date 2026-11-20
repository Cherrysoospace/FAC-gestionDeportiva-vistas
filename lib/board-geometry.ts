// Geometría de la pizarra (HU-GC-09): el backend guarda posiciones en
// porcentaje del campo (0 a 100); aquí se pasan a la cancha dibujada en SVG.

// Proporción de una cancha de fútbol (105 m × 68 m)
export const FIELD_WIDTH = 105;
export const FIELD_HEIGHT = 68;

export interface FieldPoint {
    cx: number;
    cy: number;
}

// x: 0 = arco local (izquierda), 100 = arco visitante; y: 0 = arriba
export function toField(point: { x: number; y: number }): FieldPoint {
    const clamp = (value: number) => Math.min(100, Math.max(0, value));
    return { cx: (clamp(point.x) / 100) * FIELD_WIDTH, cy: (clamp(point.y) / 100) * FIELD_HEIGHT };
}

// 'Juan Pérez' → 'JP'
export function playerInitials(fullName: string): string {
    return fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('');
}

// Segundos desde el último registro, para avisar si la pizarra quedó sin datos nuevos
export function secondsSince(isoDate: string, now = Date.now()): number {
    return Math.max(0, Math.round((now - new Date(isoDate).getTime()) / 1000));
}
