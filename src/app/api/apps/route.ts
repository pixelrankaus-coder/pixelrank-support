import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAllApps } from '@/lib/app-registry';

// Register apps for API routes
import '@/apps/ai-assist';
import '@/apps/demo-apps';
import '@/apps/quick-notes';

// GET /api/apps - List all available apps with installation status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all registered apps from the registry
    const allApps = getAllApps();

    // Try to get installed apps from database
    let installedApps: { appId: string; isEnabled: boolean; config: string | null }[] = [];
    try {
      // @ts-expect-error - InstalledApp model may not exist yet
      installedApps = await prisma.installedApp.findMany({
        select: {
          appId: true,
          isEnabled: true,
          config: true,
        },
      });
    } catch {
      // Table doesn't exist yet - use mock data
      installedApps = [
        { appId: 'ai-assist', isEnabled: true, config: null }
      ];
    }

    // Create a map for quick lookup
    const installedMap = new Map(
      installedApps.map(app => [app.appId, app])
    );

    // Combine registry data with installation status
    const appsWithStatus = allApps.map(app => ({
      id: app.id,
      name: app.name,
      description: app.description,
      longDescription: app.longDescription,
      icon: app.icon,
      version: app.version,
      category: app.category,
      isPremium: app.isPremium,
      monthlyPrice: app.monthlyPrice,
      permissions: app.permissions,
      slots: Object.keys(app.slots),
      isInstalled: installedMap.has(app.id),
      isEnabled: installedMap.get(app.id)?.isEnabled ?? false,
      config: installedMap.get(app.id)?.config
        ? JSON.parse(installedMap.get(app.id)!.config!)
        : {},
      // Enhanced marketplace fields
      screenshots: app.screenshots,
      developer: app.developer,
      reviewStats: app.reviewStats,
      features: app.features,
      requirements: app.requirements,
      changelog: app.changelog,
      tags: app.tags,
      isFeatured: app.isFeatured,
      isNew: app.isNew,
      isPopular: app.isPopular,
      isStaffPick: app.isStaffPick,
      releaseDate: app.releaseDate,
      lastUpdated: app.lastUpdated,
      supportUrl: app.supportUrl,
      documentationUrl: app.documentationUrl,
      privacyPolicyUrl: app.privacyPolicyUrl,
    }));

    return NextResponse.json(appsWithStatus);
  } catch (error) {
    console.error('Error fetching apps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apps' },
      { status: 500 }
    );
  }
}
