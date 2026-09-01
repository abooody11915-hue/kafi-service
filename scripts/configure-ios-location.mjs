import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const plistPath = resolve("ios/App/App/Info.plist");
const permissionKey = "NSLocationWhenInUseUsageDescription";

try {
  const current = await readFile(plistPath, "utf8");
  if (current.includes(`<key>${permissionKey}</key>`)) {
    console.log("iOS location permission is already configured.");
    process.exit(0);
  }

  const closingDictionary = current.lastIndexOf("</dict>");
  if (closingDictionary < 0) throw new Error("Info.plist root dictionary was not found");
  const permission = `\t<key>${permissionKey}</key>\n\t<string>نستخدم موقعك لتحديد مكان تنفيذ الخدمة بدقة عند طلبك.</string>\n`;
  const updated = `${current.slice(0, closingDictionary)}${permission}${current.slice(closingDictionary)}`;
  await writeFile(plistPath, updated, "utf8");
  console.log("Configured iOS location permission.");
} catch (error) {
  console.error(`Unable to configure iOS location permission: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
