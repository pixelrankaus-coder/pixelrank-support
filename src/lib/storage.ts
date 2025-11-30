import { prisma } from "./db";

// Storage configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || "attachments";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/json",
  "application/zip",
  "application/x-zip-compressed",
];

export interface UploadResult {
  success: boolean;
  attachment?: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  };
  error?: string;
}

/**
 * Generate a unique filename
 */
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop() || "";
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_");
  return `${timestamp}-${random}-${baseName.substring(0, 50)}.${extension}`;
}

/**
 * Upload file to Supabase Storage
 */
async function uploadToSupabase(
  file: File,
  filename: string
): Promise<{ url: string; storageKey: string } | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log("Supabase not configured, falling back to local storage");
    return null;
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${filename}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: file,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const url = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filename}`;
    return { url, storageKey: filename };
  } catch (error) {
    console.error("Supabase upload failed:", error);
    return null;
  }
}

/**
 * Convert file to base64 for local storage (fallback)
 */
async function fileToBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

/**
 * Upload a file attachment
 */
export async function uploadAttachment(
  file: File,
  options: {
    ticketId?: string;
    messageId?: string;
    uploadedById?: string;
    uploadedByType?: "AGENT" | "CONTACT";
  }
): Promise<UploadResult> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "File type not allowed",
      };
    }

    const filename = generateFilename(file.name);
    let url: string;
    let storageKey: string | null = null;

    // Try Supabase first, fall back to base64
    const supabaseResult = await uploadToSupabase(file, filename);
    if (supabaseResult) {
      url = supabaseResult.url;
      storageKey = supabaseResult.storageKey;
    } else {
      // Fall back to base64 storage in database
      url = await fileToBase64(file);
    }

    // Save attachment record
    const attachment = await prisma.attachment.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url,
        storageKey,
        ticketId: options.ticketId,
        messageId: options.messageId,
        uploadedById: options.uploadedById,
        uploadedByType: options.uploadedByType,
      },
    });

    return {
      success: true,
      attachment: {
        id: attachment.id,
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        url: attachment.url,
      },
    };
  } catch (error) {
    console.error("Failed to upload attachment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
    };
  }
}

/**
 * Get attachments for a ticket
 */
export async function getTicketAttachments(ticketId: string) {
  return prisma.attachment.findMany({
    where: { ticketId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get attachments for a message
 */
export async function getMessageAttachments(messageId: string) {
  return prisma.attachment.findMany({
    where: { messageId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Delete an attachment
 */
export async function deleteAttachment(attachmentId: string): Promise<boolean> {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return false;
    }

    // Delete from Supabase if stored there
    if (attachment.storageKey && SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        await fetch(
          `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${attachment.storageKey}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
      } catch (error) {
        console.error("Failed to delete from Supabase:", error);
      }
    }

    // Delete database record
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return true;
  } catch (error) {
    console.error("Failed to delete attachment:", error);
    return false;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
