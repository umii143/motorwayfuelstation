export interface ForecastImpactResult {
  conservative: number;
  expected: number;
  aggressive: number;
}

export const forecastImpactEngine = {
  /**
   * Calculates the expected revaluation impact over the next 30 days
   * based on historical sales trends (7, 14, and 30 day averages).
   */
  calculateForecast: (
    rateDifference: number,
    sales7DayAvg: number,   // Liters per day over last 7 days
    sales14DayAvg: number,  // Liters per day over last 14 days
    sales30DayAvg: number   // Liters per day over last 30 days
  ): ForecastImpactResult => {
    // Expected impact is exactly 30 days of sales * rate difference
    const impact7 = sales7DayAvg * 30 * rateDifference;
    const impact14 = sales14DayAvg * 30 * rateDifference;
    const impact30 = sales30DayAvg * 30 * rateDifference;

    // We sort the projected impacts to determine conservative, expected, aggressive
    // If rateDifference is positive (Gain), aggressive is the highest value
    // If rateDifference is negative (Loss), aggressive is the lowest value (most loss)
    
    const sortedImpacts = [impact7, impact14, impact30].sort((a, b) => a - b);

    if (rateDifference >= 0) {
      return {
        conservative: sortedImpacts[0], // Smallest gain
        expected: sortedImpacts[1],     // Median gain
        aggressive: sortedImpacts[2]    // Largest gain
      };
    } else {
      return {
        conservative: sortedImpacts[2], // Smallest loss (closest to 0)
        expected: sortedImpacts[1],     // Median loss
        aggressive: sortedImpacts[0]    // Largest loss (most negative)
      };
    }
  }
};
