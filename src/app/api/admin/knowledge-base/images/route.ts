import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Storage configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || "attachments";

// Max file size: 5MB for images
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

/**
 * Generate a unique filename for KB images
 */
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop() || "png";
  const baseName = originalName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9]/g, "_");
  return `kb/${timestamp}-${random}-${baseName.substring(0, 30)}.${extension}`;
}

/**
 * Upload image to Supabase Storage
 */
async function uploadToSupabase(
  file: File,
  filename: string
): Promise<{ url: string } | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log("Supabase not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${filename}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": file.type,
        },
        body: file,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${response.statusText} - ${error}`);
    }

    const url = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filename}`;
    return { url };
  } catch (error) {
    console.error("Supabase upload failed:", error);
    return null;
  }
}

/**
 * Convert file to base64 data URL (fallback)
 */
async function fileToBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

// POST /api/admin/knowledge-base/images - Upload an image for KB articles
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only image files are allowed (JPEG, PNG, GIF, WebP, SVG)" },
        { status: 400 }
      );
    }

    const filename = generateFilename(file.name);
    let url: string;

    // Try Supabase first, fall back to base64
    const supabaseResult = await uploadToSupabase(file, filename);
    if (supabaseResult) {
      url = supabaseResult.url;
    } else {
      // Fall back to base64 data URL
      url = await fileToBase64(file);
    }

    return NextResponse.json({
      success: true,
      url,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error("Failed to upload image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
