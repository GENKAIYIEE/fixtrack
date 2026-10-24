export type WorkerRecord = {
  id: string; name: string; contactNumber: string; specialization: string;
  isAvailable: boolean; isArchived: boolean; updatedAt: string;
  availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE' | 'ARCHIVED'; activeTaskCount: number;
};
export type RecordedWorker = {
  id: string; workerId: string; workerName: string; contactNumber: string; specialization: string;
  assignedAt: string; releasedAt: string | null;
  worker?: { isAvailable: boolean; isArchived: boolean; assignments: { id: string }[] };
};
