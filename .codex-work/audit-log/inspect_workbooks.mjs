import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workDir = "E:/swp391-rbl-project-se20a01_team3/.codex-work/audit-log";
const sources = [
  { label: "AIAuditLogSWP", file: "E:/AI/AIAuditLogSWP.xlsx" },
  { label: "AIAuditLogSWP_Completed", file: "E:/AI/AIAuditLogSWP_Completed.xlsx" },
  { label: "AIAuditLog_VoThiHaMy", file: "E:/AI/AIAuditLog_VoThiHaMy_DE190242.xlsx" },
  { label: "AI_Audig_Log_repo", file: "E:/swp391-rbl-project-se20a01_team3/AI Audig Log.xlsx" },
];

await fs.mkdir(workDir, { recursive: true });

for (const source of sources) {
  const input = await FileBlob.load(source.file);
  const workbook = await SpreadsheetFile.importXlsx(input);
  const summary = await workbook.inspect({
    kind: "workbook,sheet,table,definedName,drawing",
    maxChars: 12000,
    tableMaxRows: 12,
    tableMaxCols: 16,
    tableMaxCellChars: 200,
  });
  await fs.writeFile(path.join(workDir, `${source.label}_summary.ndjson`), summary.ndjson, "utf8");
  console.log(`=== ${source.label} ===`);
  console.log(summary.ndjson);
}
