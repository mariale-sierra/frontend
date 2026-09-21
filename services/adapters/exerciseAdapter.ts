import type {
  ExerciseListRow,
  ExerciseDetail,
  MuscleSummary,
  MuscleDetail,
  MuscleSvgPartDto,
} from '../exercises/exercises.service';
import type { AnatomyHighlight, AnatomyView } from '../../components/anatomy/muscleAnatomyView';

/** UI view model for one row of the exercise catalog list — always carries an
 * image (RepDB exercises always have at least one asset), and a single
 * "category · location" meta line matching the existing routine-picker's
 * row convention. */
export interface ExerciseListItemViewModel {
  id: number;
  slug: string;
  name: string;
  imageUrl: string | null;
  meta: string;
  categoryCode: string | null;
  locationCode: string | null;
}

export function adaptExerciseListRow(row: ExerciseListRow): ExerciseListItemViewModel {
  const categoryLabel = row.category?.name ?? '';
  const locationLabel = row.locations[0]?.name ?? '';
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    imageUrl: row.imageUrl,
    meta: [categoryLabel, locationLabel].filter(Boolean).join(' · '),
    categoryCode: row.category?.code ?? null,
    locationCode: row.locations[0]?.code ?? null,
  };
}

/** Picks the exercise's own primary asset (start/main preferred over peak) as
 * the detail screen's header image — mirrors the backend's own
 * ASSET_TYPE_PRIORITY ordering so both agree on "the" representative image. */
const ASSET_TYPE_PRIORITY = ['main', 'start', 'peak', 'thumbnail', 'animation'];

export function pickHeaderImageUrl(assets: ExerciseDetail['assets']): string | null {
  const sorted = [...assets].sort(
    (a, b) => ASSET_TYPE_PRIORITY.indexOf(a.type) - ASSET_TYPE_PRIORITY.indexOf(b.type),
  );
  return sorted[0]?.url ?? null;
}

/** Builds the highlight list `MuscleAnatomyView` needs for one exercise's
 * detail panel, from its `muscles[]` (each carrying its own svgParts would be
 * a bigger payload — instead the muscle detail endpoint's svgParts are reused
 * by passing muscle codes through; for the exercise-detail screen this
 * function is applied once the caller has fetched each muscle's svgParts, see
 * `useExerciseAnatomyHighlights`). Exported separately so a screen can build
 * highlights straight from a `MuscleSummary[]`/`MuscleDetail` regardless of
 * which endpoint supplied it. */
export function buildAnatomyHighlights(
  muscles: { svgParts: MuscleSvgPartDto[]; role: 'primary' | 'secondary' }[],
  view: AnatomyView,
): AnatomyHighlight[] {
  const highlights: AnatomyHighlight[] = [];
  for (const muscle of muscles) {
    for (const part of muscle.svgParts) {
      if (part.view !== view) continue;
      highlights.push({ svgPartId: part.svgPartId, role: muscle.role });
    }
  }
  return highlights;
}

/** Same idea for the muscle-browser's single-muscle view — always "primary"
 * since there's no primary/secondary distinction for a lone muscle. */
export function buildSingleMuscleHighlights(
  svgParts: MuscleSvgPartDto[],
  view: AnatomyView,
): AnatomyHighlight[] {
  return svgParts.filter((p) => p.view === view).map((p) => ({ svgPartId: p.svgPartId, role: 'primary' as const }));
}

export interface MuscleListItemViewModel {
  id: number;
  code: string;
  name: string;
  iconUrl: string | null;
}

export function adaptMuscleSummary(muscle: MuscleSummary): MuscleListItemViewModel {
  return { id: muscle.id, code: muscle.code, name: muscle.name, iconUrl: muscle.iconUrl };
}

export function adaptMuscleExerciseRow(
  row: MuscleDetail['primaryExercises']['data'][number],
): ExerciseListItemViewModel {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    imageUrl: row.imageUrl,
    meta: '',
    categoryCode: null,
    locationCode: null,
  };
}

/**
 * The catalog exercise a routine's exercise stands for, from a name search's rows:
 * the row whose name is the same (ignoring case and spaces at the ends — routines
 * carry the catalog's own name, "HIP THRUST", but the case is not worth relying
 * on), or, failing that, the only row there is. `null` when there is no such
 * exercise, or the search left several and none matches.
 */
export function pickExerciseIdByName(rows: Pick<ExerciseListRow, 'id' | 'name'>[], name: string): number | null {
  const wanted = name.trim().toLowerCase();
  const exact = rows.find((row) => row.name.trim().toLowerCase() === wanted);
  if (exact) return exact.id;
  return rows.length === 1 ? rows[0].id : null;
}

/**
 * The live catalog's code for a location is not always the one the UI keys its label
 * and icon by: the "any location" entry is 'cualquier-lugar' there, not 'anywhere'
 * (see backend/database/seeds/2026-08-28-02). Left as it is, its badge came out as a
 * raw translation key with no icon.
 */
const LOCATION_CODE_ALIASES: Record<string, string> = { 'cualquier-lugar': 'anywhere' };

export function normalizeLocationCode(code: string): string {
  return LOCATION_CODE_ALIASES[code] ?? code;
}

// Category-code normalization moved to constants/challengeFilters.ts
// (`normalizeCategoryCode`/`activityTypeForCategoryCode`) — that's the one
// place `CATEGORY_CODE_TO_ACTIVITY` itself lives, so the normalization and
// the map it feeds can never drift out of sync with each other again.
