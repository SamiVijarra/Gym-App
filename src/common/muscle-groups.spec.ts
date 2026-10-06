import { readFileSync } from 'fs';
import { join } from 'path';
import {
  EXERCISE_MUSCLES,
  getMuscleGroup,
  MUSCLE_GROUP_KEYS,
} from './muscle-groups';

describe('EXERCISE_MUSCLES', () => {
  it('maps every selectable muscle to a muscle group', () => {
    for (const muscle of EXERCISE_MUSCLES) {
      expect(getMuscleGroup([muscle])).not.toBeNull();
    }
  });

  it('covers every muscle used by the seeded catalog', () => {
    const raw = readFileSync(
      join(__dirname, '..', 'seed', 'data', 'exercises-data.json'),
      'utf-8',
    );
    const data = JSON.parse(raw) as { primaryMuscles?: string[] }[];
    const seeded = new Set(data.flatMap((e) => e.primaryMuscles ?? []));

    for (const muscle of seeded) {
      expect(EXERCISE_MUSCLES).toContain(muscle);
    }
  });

  it('reaches every muscle group', () => {
    const groups = new Set(EXERCISE_MUSCLES.map((m) => getMuscleGroup([m])));
    for (const key of MUSCLE_GROUP_KEYS) {
      expect(groups).toContain(key);
    }
  });
});
