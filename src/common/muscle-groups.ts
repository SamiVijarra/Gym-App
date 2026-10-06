export const MUSCLE_GROUPS = {
  chest: ['chest'],
  back: ['lats', 'middle back', 'lower back', 'traps', 'back'],
  shoulders: ['shoulders', 'shoulder', 'neck'],
  arms: ['biceps', 'triceps', 'forearms', 'arms'],
  legs: [
    'quadriceps',
    'hamstrings',
    'calves',
    'adductors',
    'abductors',
    'legs',
    'quads',
  ],
  glutes: ['glutes', 'glute'],
  core: ['abdominals', 'core', 'abs'],
} as const;

export type MuscleGroup = keyof typeof MUSCLE_GROUPS;

export const MUSCLE_GROUP_KEYS = Object.keys(MUSCLE_GROUPS) as MuscleGroup[];

const MUSCLE_TO_GROUP = new Map<string, MuscleGroup>(
  MUSCLE_GROUP_KEYS.flatMap((group) =>
    MUSCLE_GROUPS[group].map(
      (muscle) => [muscle, group] as [string, MuscleGroup],
    ),
  ),
);

export function getMuscleGroup(
  primaryMuscles?: string[] | null,
): MuscleGroup | null {
  const first = primaryMuscles?.[0]?.trim().toLowerCase();
  return first ? (MUSCLE_TO_GROUP.get(first) ?? null) : null;
}

export function getMuscleGroups(
  exercises: { primaryMuscles?: string[] | null }[],
): MuscleGroup[] {
  const found = new Set<MuscleGroup>();
  for (const exercise of exercises) {
    const group = getMuscleGroup(exercise.primaryMuscles);
    if (group) found.add(group);
  }
  return MUSCLE_GROUP_KEYS.filter((group) => found.has(group));
}

export const EXERCISE_MUSCLES = [
  'abdominals',
  'abductors',
  'adductors',
  'biceps',
  'calves',
  'chest',
  'forearms',
  'glutes',
  'hamstrings',
  'lats',
  'lower back',
  'middle back',
  'neck',
  'quadriceps',
  'shoulders',
  'traps',
  'triceps',
] as const;

export type ExerciseMuscle = (typeof EXERCISE_MUSCLES)[number];
