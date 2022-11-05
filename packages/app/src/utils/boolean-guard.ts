type BooleanGuard = <T>(value: T) => value is NonNullable<T>;

export const booleanGuard = Boolean as any as BooleanGuard;
