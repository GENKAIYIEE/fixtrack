import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import ForgotClient from './ForgotClient';

export const dynamic = 'force-dynamic';

export default async function ForgotPasswordPage() {
  let platformName = 'FixTrack';
  let logoUrl = '';

  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ['platform_name', 'logo_url']
        }
      }
    });

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    if (settingsMap.platform_name) platformName = settingsMap.platform_name;
    if (settingsMap.logo_url !== undefined) logoUrl = settingsMap.logo_url;
  } catch (err) {
    console.error('Failed to load settings:', err);
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-surface-container-lowest">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </main>
      }
    >
      <ForgotClient initialPlatformName={platformName} initialLogoUrl={logoUrl} />
    </Suspense>
  );
}
