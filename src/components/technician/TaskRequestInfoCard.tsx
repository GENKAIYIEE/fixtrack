import PhotoGallery from '@/components/shared/PhotoGallery';
import OfficialRequestDetails, { OfficialRequestDetailsData } from '@/components/shared/OfficialRequestDetails';

export function TaskRequestInfoCard({ request }: {
  request: OfficialRequestDetailsData & { requestCode: string; photoUrl: string | null };
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-blue-900 px-6 py-4 font-semibold text-white">Request Information</div>
      <div className="space-y-6 p-6">
        <OfficialRequestDetails request={request} />
        {request.photoUrl && <PhotoGallery photoUrl={request.photoUrl} label="Previously Submitted Photos" />}
      </div>
    </div>
  );
}
