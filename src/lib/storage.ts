import { put } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Local dev has no Vercel Blob token, so files are written to /public/uploads
// instead. In production (Vercel), BLOB_READ_WRITE_TOKEN is set and uploads
// go to Vercel Blob.
async function saveImage(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const filename = `${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`${folder}/${filename}`, file, { access: "public" });
    return blob.url;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

export function saveTeamLogo(file: File): Promise<string> {
  return saveImage(file, "team-logos");
}

export function saveTournamentLogo(file: File): Promise<string> {
  return saveImage(file, "tournament-logos");
}
