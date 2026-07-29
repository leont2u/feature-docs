import * as fs from "fs/promises";
import * as path from "path";

export async function readIfExists(
  filePath: string,
): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (err) {
    if (isNodeError(err) && err.code === "ENOENT") {
      return undefined;
    }
    throw err;
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function joinFeaturePath(
  featureFolderPath: string,
  fileName: string,
): string {
  return path.join(featureFolderPath, fileName);
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}
