import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Helper to log activity
async function logActivity(
  companyId: string,
  eventType: string,
  message: string,
  status: "INFO" | "SUCCESS" | "WARNING" | "ERROR",
  details?: object
) {
  try {
    await prisma.blazeActivityLog.create({
      data: {
        companyId,
        eventType,
        message,
        status,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

// POST /api/companies/[id]/blaze/test - Test a Blaze API key
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required", valid: false },
        { status: 400 }
      );
    }

    // Test the API key by making a request to Blaze
    // Since Blaze uses Zapier integration, we'll try to validate via their API
    // For now, we'll attempt to use the API key with a simple endpoint

    // Based on research, Blaze API works via Zapier and requires testing with their endpoints
    // The API key format and validation endpoint isn't publicly documented
    // We'll try a basic approach - if the key is formatted correctly, we consider it potentially valid

    // For a real implementation, you would:
    // 1. Call a Blaze API endpoint with the API key
    // 2. Check if the response is valid

    // Attempt to validate by trying the Blaze API
    // Note: This is a placeholder - actual endpoint may differ
    try {
      // Blaze uses their API for Zapier integration
      // We can try to make a simple authenticated request
      const testResponse = await fetch("https://api.blaze.ai/v1/workspace", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      // If we get a response (even an error), the API key format might be valid
      if (testResponse.ok) {
        const data = await testResponse.json();
        await logActivity(id, "API_TEST", "API key validated successfully", "SUCCESS");
        return NextResponse.json({
          valid: true,
          workspace: data,
          message: "API key is valid",
        });
      } else if (testResponse.status === 401) {
        await logActivity(id, "API_TEST", "API key authentication failed", "ERROR");
        return NextResponse.json({
          valid: false,
          message: "Invalid API key - authentication failed",
        });
      } else {
        // Unknown response - might still be valid but endpoint doesn't exist
        // For now, if the key looks valid (non-empty, reasonable length), accept it
        const isValidFormat = apiKey.length >= 20 && apiKey.length <= 200;
        await logActivity(
          id,
          "API_TEST",
          isValidFormat ? "API key format validated" : "API key format invalid",
          isValidFormat ? "WARNING" : "ERROR"
        );
        return NextResponse.json({
          valid: isValidFormat,
          message: isValidFormat
            ? "API key format looks valid (could not verify with Blaze)"
            : "API key format appears invalid",
        });
      }
    } catch (fetchError) {
      // Network error or API not reachable
      // Accept the key if it looks valid
      const isValidFormat = apiKey.length >= 20 && apiKey.length <= 200;
      await logActivity(
        id,
        "API_TEST",
        isValidFormat ? "API key saved (Blaze API unreachable)" : "API key format invalid",
        isValidFormat ? "WARNING" : "ERROR"
      );
      return NextResponse.json({
        valid: isValidFormat,
        message: isValidFormat
          ? "API key saved (Blaze API not reachable for validation)"
          : "API key format appears invalid",
      });
    }
  } catch (error) {
    console.error("Failed to test Blaze API key:", error);
    return NextResponse.json(
      { error: "Failed to test API key", valid: false },
      { status: 500 }
    );
  }
}
