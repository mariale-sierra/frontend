import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { colors, radius, spacing } from '../../constants/theme';

export type CycleDayStatus = 'empty' | 'configured' | 'rest';

export interface CycleDayTimelineStepperProps {
  totalDays: number;
  selectedDay: number;
  onSelectDay?: (dayNumber: number) => void;
  getDayStatus?: (dayNumber: number) => CycleDayStatus;
  daysPerRow?: number;
}

interface Point {
  x: number;
  y: number;
}

interface TrailDot {
  id: string;
  x: number;
  y: number;
}

const DEFAULT_DAYS_PER_ROW = 7;
const NODE_SIZE = 40;
const ROW_GAP = spacing.md;
const DOT_SIZE = 4;
// Gap cleared on each side of a node so dots don't overlap the circle border
const NODE_TRIM = NODE_SIZE / 2 + 4;
const DOT_SPACING = 11;

function computeNodeCenters(
  totalDays: number,
  containerWidth: number,
  daysPerRow: number,
): Record<number, Point> {
  const centers: Record<number, Point> = {};

  for (let i = 0; i < totalDays; i += 1) {
    const dayNumber = i + 1;
    const row = Math.floor(i / daysPerRow);
    const col = i % daysPerRow;
    const nodesInRow = Math.min(daysPerRow, totalDays - row * daysPerRow);

    let centerX: number;

    if (nodesInRow === 1) {
      centerX = containerWidth / 2;
    } else {
      const colSpacing = (containerWidth - NODE_SIZE) / (nodesInRow - 1);
      centerX = NODE_SIZE / 2 + col * colSpacing;
    }

    const centerY = row * (NODE_SIZE + ROW_GAP) + NODE_SIZE / 2;
    centers[dayNumber] = { x: centerX, y: centerY };
  }

  return centers;
}

function appendSegmentDots(params: {
  dots: TrailDot[];
  idPrefix: string;
  start: Point;
  end: Point;
  trimStart: number;
  trimEnd: number;
}) {
  const { dots, idPrefix, start, end, trimStart, trimEnd } = params;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt((dx ** 2) + (dy ** 2));
  const available = dist - trimStart - trimEnd;

  if (dist <= 0 || available <= 0) {
    return;
  }

  const dotCount = Math.max(1, Math.floor(available / DOT_SPACING));

  for (let i = 0; i < dotCount; i += 1) {
    const t = (trimStart + (i + 0.5) * (available / dotCount)) / dist;
    dots.push({
      id: `${idPrefix}-${i}`,
      x: start.x + dx * t,
      y: start.y + dy * t,
    });
  }
}

function buildTrailDots(
  totalDays: number,
  centers: Record<number, Point>,
  daysPerRow: number,
  containerWidth: number,
): TrailDot[] {
  const dots: TrailDot[] = [];

  for (let day = 1; day < totalDays; day += 1) {
    const start = centers[day];
    const end = centers[day + 1];

    if (!start || !end) {
      continue;
    }

    const wrapsToNextRow = day % daysPerRow === 0;

    if (wrapsToNextRow) {
      // Row handoff: trail exits to right edge, then resumes from left edge on next row.
      appendSegmentDots({
        dots,
        idPrefix: `dot-${day}-right`,
        start,
        end: { x: containerWidth, y: start.y },
        trimStart: NODE_TRIM,
        trimEnd: 0,
      });

      appendSegmentDots({
        dots,
        idPrefix: `dot-${day + 1}-left`,
        start: { x: 0, y: end.y },
        end,
        trimStart: 0,
        trimEnd: NODE_TRIM,
      });
      continue;
    }

    appendSegmentDots({
      dots,
      idPrefix: `dot-${day}`,
      start,
      end,
      trimStart: NODE_TRIM,
      trimEnd: NODE_TRIM,
    });
  }

  return dots;
}

export function CycleDayTimelineStepper({
  totalDays,
  selectedDay,
  onSelectDay,
  getDayStatus,
  daysPerRow = DEFAULT_DAYS_PER_ROW,
}: CycleDayTimelineStepperProps) {
  const safeTotalDays = Math.max(0, totalDays);
  const safeDaysPerRow = Math.max(1, daysPerRow);
  const [containerWidth, setContainerWidth] = useState(0);

  function handleContainerLayout(event: LayoutChangeEvent) {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  }

  const rows = useMemo(() => {
    const result: number[][] = [];
    for (let day = 1; day <= safeTotalDays; day += safeDaysPerRow) {
      result.push(
        Array.from(
          { length: Math.min(safeDaysPerRow, safeTotalDays - day + 1) },
          (_, i) => day + i,
        ),
      );
    }
    return result;
  }, [safeTotalDays, safeDaysPerRow]);

  const nodeCenters = useMemo(
    () => computeNodeCenters(safeTotalDays, containerWidth, safeDaysPerRow),
    [safeTotalDays, containerWidth, safeDaysPerRow],
  );

  const trailDots = useMemo(
    () => (
      containerWidth > 0
        ? buildTrailDots(safeTotalDays, nodeCenters, safeDaysPerRow, containerWidth)
        : []
    ),
    [safeTotalDays, nodeCenters, safeDaysPerRow, containerWidth],
  );

  // Total rendered height so the absolute overlay can size correctly
  const gridHeight = rows.length * NODE_SIZE + Math.max(0, rows.length - 1) * ROW_GAP;

  return (
    <View onLayout={handleContainerLayout}>
      <View style={[styles.grid, { height: gridHeight }]}>
        {/* Dot trail — below nodes */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {trailDots.map((dot) => (
            <View
              key={dot.id}
              style={[
                styles.trailDot,
                { left: dot.x - DOT_SIZE / 2, top: dot.y - DOT_SIZE / 2 },
              ]}
            />
          ))}
        </View>

        {/* Rows */}
        <View style={styles.rows}>
          {rows.map((rowDays, rowIndex) => (
            <View
              key={`cycle-row-${rowIndex}`}
              style={[
                styles.row,
                rowDays.length === 1 && styles.rowSingle,
              ]}
            >
              {rowDays.map((dayNumber) => {
                const status = getDayStatus?.(dayNumber) ?? 'empty';
                const selected = dayNumber === selectedDay;

                return (
                  <Pressable
                    key={`day-node-${dayNumber}`}
                    onPress={() => onSelectDay?.(dayNumber)}
                    style={({ pressed }) => [
                      styles.dayNode,
                      status === 'configured' && styles.dayNodeConfigured,
                      status === 'rest' && styles.dayNodeRest,
                      selected && styles.dayNodeSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text variant="caption" style={[styles.dayLabel, selected && styles.dayLabelSelected]}>
                      {dayNumber}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    position: 'relative',
  },
  rows: {
    ...StyleSheet.absoluteFillObject,
    gap: ROW_GAP,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: NODE_SIZE,
  },
  rowSingle: {
    justifyContent: 'center',
  },
  trailDot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dayNode: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNodeConfigured: {
    borderColor: 'rgba(74,222,128,0.85)',
    backgroundColor: 'rgba(74,222,128,0.18)',
  },
  dayNodeRest: {
    borderColor: 'rgba(38,230,254,0.88)',
    backgroundColor: 'rgba(38,230,254,0.18)',
  },
  dayNodeSelected: {
    borderColor: colors.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  dayLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '600',
  },
  dayLabelSelected: {
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.85,
  },
});
