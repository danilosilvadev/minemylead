import { attachmentDisposition, contentTypeFor, isSafeObjectName, isVersion } from "./shared";

export type ReleaseFile = {
  name: string;
  size: number;
};

export type ReleaseGroup = {
  version: string;
  files: ReleaseFile[];
};

const FILE_ORDER = [
  "MineMyLead-windows-x64-setup.exe",
  "MineMyLead-windows-x64.zip",
  "MineMyLead-macos.dmg",
  "MineMyLead-linux-x64.AppImage",
  "MineMyLead-android.apk",
  "MineMyLead-ios-unsigned.ipa",
];

export async function readLatest(bucket: R2Bucket): Promise<string | null> {
  const object = await bucket.get("latest");
  if (!object) return null;
  const version = (await object.text()).trim();
  if (!isVersion(version)) return null;
  return version;
}

export async function listReleases(bucket: R2Bucket): Promise<ReleaseGroup[]> {
  const grouped = new Map<string, ReleaseFile[]>();
  let cursor: string | undefined;
  for (;;) {
    const page = await bucket.list({ cursor, limit: 1000 });
    for (const object of page.objects) {
      if (object.key === "latest") continue;
      const slash = object.key.indexOf("/");
      if (slash <= 0 || slash !== object.key.lastIndexOf("/")) continue;
      const version = object.key.slice(0, slash);
      const name = object.key.slice(slash + 1);
      if (!isVersion(version) || !isSafeObjectName(name)) continue;
      const files = grouped.get(version) ?? [];
      files.push({ name, size: object.size });
      grouped.set(version, files);
    }
    if (!page.truncated) break;
    cursor = page.cursor;
  }

  for (const files of grouped.values()) {
    files.sort((a, b) => fileRank(a.name) - fileRank(b.name) || a.name.localeCompare(b.name));
  }
  return [...grouped.entries()].map(([version, files]) => ({ version, files }));
}

function fileRank(name: string): number {
  const index = FILE_ORDER.indexOf(name);
  return index === -1 ? FILE_ORDER.length : index;
}

export function sortReleases(groups: ReleaseGroup[], latest: string | null): ReleaseGroup[] {
  return [...groups].sort((a, b) => {
    if (a.version === latest) return -1;
    if (b.version === latest) return 1;
    return b.version.localeCompare(a.version, "en", { numeric: true });
  });
}

export async function openObject(bucket: R2Bucket, key: string): Promise<R2ObjectBody | null> {
  return bucket.get(key);
}

export function fileResponse(object: R2ObjectBody, filename: string): Response {
  const headers = new Headers({
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-robots-tag": "noindex, nofollow",
    "referrer-policy": "no-referrer",
    "content-type": contentTypeFor(filename),
    "content-disposition": attachmentDisposition(filename),
    "content-length": String(object.size),
    "accept-ranges": "none",
  });
  return new Response(object.body, { status: 200, headers });
}

export async function cancelObject(object: R2ObjectBody): Promise<void> {
  try {
    await object.body.cancel();
  } catch {
    // The body may already be closed.
  }
}
