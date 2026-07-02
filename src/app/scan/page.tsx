'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession } from 'next-auth/react';

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      const building = searchParams.get('building');
      const room = searchParams.get('room');

      // Small delay to ensure any existing session logic completes
      await new Promise((resolve) => setTimeout(resolve, 500));
      const session = await getSession();
      const role = session?.user?.role;

      const params = new URLSearchParams();
      if (building) params.set('building', building);
      if (room) params.set('room', room);
      const query = params.toString();
      const queryString = query ? `?${query}` : '';

      if (role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else if (role === 'TECHNICIAN') {
        router.replace('/technician/dashboard');
      } else if (role === 'STUDENT') {
        router.replace(`/requests/new${queryString}`);
      } else {
        router.replace(`/login?redirect=/requests/new${building || room ? '&' + query : ''}`);
      }
    };

    checkSessionAndRedirect();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-container-lowest">
      <div className="flex items-center justify-center w-20 h-20 bg-primary-container rounded-xl shadow-lg mb-8 overflow-hidden">
        <span className="material-symbols-outlined text-on-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>domain</span>
      </div>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="mt-4 font-body text-on-surface-variant">Checking session...</p>
    </div>
  );
}
