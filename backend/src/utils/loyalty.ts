export const calcTier = (points: number): string => {
  if (points >= 500) return "Gold";
  if (points >= 100) return "Silver";
  return "Bronze";
};

export const calcAutoDiscountRate = (tier: string): number => {
  if (tier === "Gold") return 0.05;
  if (tier === "Silver") return 0.03;
  return 0;
};

export const calcPointsEarned = (netAmount: number): number => {
  return Math.floor(Math.max(0, netAmount) / 10);
};
