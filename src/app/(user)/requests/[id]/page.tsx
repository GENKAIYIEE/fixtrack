export default async function UserRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div>Request Detail: {id}</div>
}
