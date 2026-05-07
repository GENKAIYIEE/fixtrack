export default async function TechnicianTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div>Task Detail: {id}</div>
}
