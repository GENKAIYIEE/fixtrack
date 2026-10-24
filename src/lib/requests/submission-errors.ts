/** Safe public messages: never expose SQL, storage responses, credentials or document paths. */
export class RequestPhotoStorageError extends Error {
  constructor(message: string, readonly code: string) { super(message); this.name = 'RequestPhotoStorageError'; }
}
export function requestSubmissionFailure(error: unknown) {
  if (error instanceof RequestPhotoStorageError) return { status: 503, error: error.message, code: error.code };
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
  if (code === 'P2021' || code === 'P2022') return {
    status: 503, code: 'REQUEST_SCHEMA_OUTDATED',
    error: 'The request database needs an update. Ask the administrator to check and apply the supplied migrations to the correct database. Your request was not saved.',
  };
  if (['P1000', 'P1001', 'P1002', 'P1003', 'P1008', 'P1010', 'P1011', 'P1017', 'P2024', 'P2037'].includes(String(code))) return {
    status: 503, code: 'REQUEST_DATABASE_UNAVAILABLE',
    error: 'The request database is unavailable. Check the local database connection or contact the administrator, then retry.',
  };
  return { status: 500, code: 'REQUEST_SAVE_FAILED', error: 'The request could not be saved. Please retry. If this continues, contact the administrator.' };
}
