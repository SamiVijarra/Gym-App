import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateExerciseDto } from './create-exercise.dto';

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(CreateExerciseDto, payload));

describe('CreateExerciseDto', () => {
  it('accepts a known primary muscle', async () => {
    const errors = await validateDto({
      name: 'Hip Thrust',
      primaryMuscles: ['glutes'],
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects an unknown muscle', async () => {
    const errors = await validateDto({
      name: 'Hip Thrust',
      primaryMuscles: ['Glutez'],
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('primaryMuscles');
  });

  it('rejects an empty muscle list', async () => {
    const errors = await validateDto({
      name: 'Hip Thrust',
      primaryMuscles: [],
    });
    expect(errors).toHaveLength(1);
  });
});
