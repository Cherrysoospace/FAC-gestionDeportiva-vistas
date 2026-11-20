import { FIELD_HEIGHT, FIELD_WIDTH, playerInitials, toField } from '@/lib/board-geometry';
import { Board } from '@/types/sports';

// Colores por equipo (local / visitante) con buen contraste sobre el césped
export const SIDE_COLORS = {
    HOME: { fill: '#2563eb', stroke: '#dbeafe' },
    AWAY: { fill: '#dc2626', stroke: '#fee2e2' }
} as const;

const LINE = { stroke: 'rgba(255,255,255,0.85)', strokeWidth: 0.35, fill: 'none' };

// Cancha en SVG (105 × 68) con los jugadores que participan y la pelota (HU-GC-09).
export default function BoardField({ board }: { board: Board }) {
    const placed = board.players.filter((player) => player.location);
    const ball = board.ball.location ? toField(board.ball.location) : null;
    const mid = FIELD_WIDTH / 2;
    const midY = FIELD_HEIGHT / 2;

    return (
        <svg viewBox={`-3 -3 ${FIELD_WIDTH + 6} ${FIELD_HEIGHT + 6}`} className="w-full border-round" style={{ background: '#2f7d32', maxHeight: '70vh' }} role="img" aria-label={`Pizarra: ${board.homeTeam.name} contra ${board.awayTeam.name}`}>
            {/* Franjas del césped */}
            {Array.from({ length: 10 }, (_, index) => (
                <rect key={index} x={index * (FIELD_WIDTH / 10)} y={0} width={FIELD_WIDTH / 10} height={FIELD_HEIGHT} fill={index % 2 === 0 ? '#2e7d32' : '#33873a'} />
            ))}

            {/* Líneas: borde, medio campo, círculo central y áreas */}
            <rect x={0} y={0} width={FIELD_WIDTH} height={FIELD_HEIGHT} {...LINE} />
            <line x1={mid} y1={0} x2={mid} y2={FIELD_HEIGHT} {...LINE} />
            <circle cx={mid} cy={midY} r={9.15} {...LINE} />
            <circle cx={mid} cy={midY} r={0.5} fill={LINE.stroke} />
            <rect x={0} y={midY - 20.15} width={16.5} height={40.3} {...LINE} />
            <rect x={FIELD_WIDTH - 16.5} y={midY - 20.15} width={16.5} height={40.3} {...LINE} />
            <rect x={0} y={midY - 9.15} width={5.5} height={18.3} {...LINE} />
            <rect x={FIELD_WIDTH - 5.5} y={midY - 9.15} width={5.5} height={18.3} {...LINE} />
            <rect x={-2} y={midY - 3.66} width={2} height={7.32} {...LINE} />
            <rect x={FIELD_WIDTH} y={midY - 3.66} width={2} height={7.32} {...LINE} />

            {/* Jugadores: se desplazan con transición entre actualizaciones */}
            {placed.map((player) => {
                const { cx, cy } = toField(player.location!);
                const colors = SIDE_COLORS[player.team.side];
                return (
                    <g key={player.id} style={{ transform: `translate(${cx}px, ${cy}px)`, transition: 'transform 1.2s linear' }}>
                        <title>{`${player.fullName} (${player.position}) · ${player.team.name}`}</title>
                        <circle r={2.2} fill={colors.fill} stroke={colors.stroke} strokeWidth={0.4} />
                        <text textAnchor="middle" dominantBaseline="central" fontSize={1.7} fontWeight={700} fill="#fff">
                            {playerInitials(player.fullName)}
                        </text>
                    </g>
                );
            })}

            {/* Pelota: se dibuja aparte y encima de los jugadores */}
            {ball && (
                <g style={{ transform: `translate(${ball.cx}px, ${ball.cy}px)`, transition: 'transform 1.2s linear' }}>
                    <title>{`Pelota ${board.ball.brand} ${board.ball.model}`}</title>
                    <circle r={1.1} fill="#ffffff" stroke="#111827" strokeWidth={0.3} />
                </g>
            )}
        </svg>
    );
}
