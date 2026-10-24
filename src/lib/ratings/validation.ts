export class RatingError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function ratingInput(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RatingError('Invalid rating form.');
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some(key => !['requestScore', 'workers'].includes(key))) throw new RatingError('Unsupported rating field.');
  const score = (v: unknown): number => { if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 5) throw new RatingError('Choose a whole-star rating from 1 to 5.'); return v; };
  const requestScore = score(body.requestScore);
  if (!Array.isArray(body.workers) || body.workers.length > 100) throw new RatingError('Choose up to 100 worker ratings.');
  const seen = new Set<string>();
  const workers = body.workers.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new RatingError('Invalid worker rating.');
    const w = entry as Record<string, unknown>;
    if (Object.keys(w).some(k => !['workerId', 'score'].includes(k)) || typeof w.workerId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(w.workerId) || seen.has(w.workerId)) throw new RatingError('Choose distinct recorded workers.');
    seen.add(w.workerId); return { workerId: w.workerId, score: score(w.score) };
  });
  return { requestScore, workers };
}
