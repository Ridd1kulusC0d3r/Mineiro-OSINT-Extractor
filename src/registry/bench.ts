import {
  DetectorBenchmarkMetrics,
  DetectorBenchmarkObservation,
} from './types';

function ratio(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 1000) / 1000;
}

export function calculateDetectorBenchmark(
  detectorId: string,
  observations: DetectorBenchmarkObservation[]
): DetectorBenchmarkMetrics {
  const sample = observations.filter((item) => item.detectorId === detectorId);

  let truePositive = 0;
  let trueNegative = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  let inconclusive = 0;

  for (const item of sample) {
    if (
      item.observed === 'uncertain' ||
      item.observed === 'rate_limited' ||
      item.observed === 'error'
    ) {
      inconclusive += 1;
      continue;
    }

    if (item.expected === 'present' && item.observed === 'found') truePositive += 1;
    else if (item.expected === 'absent' && item.observed === 'not_found') trueNegative += 1;
    else if (item.expected === 'absent' && item.observed === 'found') falsePositive += 1;
    else if (item.expected === 'present' && item.observed === 'not_found') falseNegative += 1;
  }

  const precision = ratio(truePositive, truePositive + falsePositive);
  const recall = ratio(truePositive, truePositive + falseNegative);
  const falsePositiveRate = ratio(falsePositive, falsePositive + trueNegative);
  const availability = sample.length
    ? Math.round(((sample.length - inconclusive) / sample.length) * 1000) / 10
    : 0;

  // Benchmark score is intentionally conservative. It rewards precision and
  // recall, penalizes false positives heavily, and accounts for availability.
  const p = precision ?? 0;
  const r = recall ?? 0;
  const fpr = falsePositiveRate ?? 1;
  const availability01 = availability / 100;

  const benchmarkScore = Math.max(
    0,
    Math.min(
      100,
      Math.round((p * 0.4 + r * 0.3 + (1 - fpr) * 0.2 + availability01 * 0.1) * 100)
    )
  );

  return {
    detectorId,
    samples: sample.length,
    truePositive,
    trueNegative,
    falsePositive,
    falseNegative,
    inconclusive,
    precision,
    recall,
    falsePositiveRate,
    availability,
    benchmarkScore,
  };
}

export function benchmarkRegistry(
  detectorIds: string[],
  observations: DetectorBenchmarkObservation[]
): DetectorBenchmarkMetrics[] {
  return detectorIds
    .map((id) => calculateDetectorBenchmark(id, observations))
    .sort((a, b) => b.benchmarkScore - a.benchmarkScore);
}
