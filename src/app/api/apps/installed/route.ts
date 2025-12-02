import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getApp } from '@/lib/app-registry';

// Register apps for API routes
import '@/apps/ai-assist';
import '@/apps/demo-apps';
import '@/apps/quick-notes';

// GET /api/apps/installed - List installed apps only
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get installed apps from database
    let installedApps: { appId: string; isEnabled: boolean; config: string | null; installedAt: Date }[] = [];
    try {
      // @ts-expect-error - InstalledApp model may not exist yet
      installedApps = await prisma.installedApp.findMany({
        where: { isEnabled: true },
        select: {
          appId: true,
          isEnabled: true,
          config: true,
          installedAt: true,
        },
      });
    } catch {
      // Table doesn't exist yet - use mock data
      installedApps = [
        {
          appId: 'ai-assist',
          isEnabled: true,
          config: null,
          installedAt: new Date()
        }
      ];
    }

    // Enrich with registry data
    const enrichedApps = installedApps
      .map(installation => {
        const app = getApp(installation.appId);
        if (!app) return null;

        return {
          app_id: installation.appId,
          enabled: installation.isEnabled,
          config: installation.config ? JSON.parse(installation.config) : {},
          installed_at: installation.installedAt.toISOString(),
          // Include registry metadata
          name: app.name,
          description: app.description,
          icon: app.icon,
          slots: Object.keys(app.slots),
        };
      })
      .filter(Boolean);

    return NextResponse.json(enrichedApps);
  } catch (error) {
    console.error('Error fetching installed apps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch installed apps' },
      { status: 500 }
    );
  }
}
