// convenient typing for `array.filter(booleanGuard)`

type BooleanGuard = <T>(
  value: T
) => value is Exclude<T, false | null | undefined>;

export const booleanGuard = Boolean as any as BooleanGuard;
