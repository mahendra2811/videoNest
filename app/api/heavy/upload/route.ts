import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { type NextRequest, NextResponse } from "next/server";

// Issues short-lived client-upload tokens so the browser can upload the source
// directly to Vercel Blob (avoiding the serverless request-body size limit).
// Returns 503 unless a Blob token is configured.
export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Server tier is not configured." }, { status: 503 });
  }

  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"],
        maximumSizeInBytes: 2_000_000_000, // 2 GB ceiling for the heavy tier
        addRandomSuffix: true,
      }),
      // The source is deleted by /api/heavy after transcoding; nothing to do here.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
