export type LimitCheck = {
  allowed: boolean;
  remaining: number;
};

export function checkCountLimit(count: number, max: number): LimitCheck {
  return {
    allowed: count < max,
    remaining: Math.max(0, max - count)
  };
}
