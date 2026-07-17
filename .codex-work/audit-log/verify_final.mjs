import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "E:/swp391-rbl-project-se20a01_team3/outputs/019f70fe-a995-7652-94f0-60e3097fd890/AIAuditLogSWP_Final.xlsx";
const previewDir = "E:/swp391-rbl-project-se20a01_team3/.codex-work/audit-log/final-previews";
await fs.mkdir(previewDir, { recursive: true });

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const checks = [
  { name: "metadata", sheet: "1. Metadata & Summary", range: "A1:E27" },
  { name: "detail_1", sheet: "2. Detailed Audit Log", range: "A1:H12" },
  { name: "detail_2", sheet: "2. Detailed Audit Log", range: "A13:H23" },
  { name: "detail_3", sheet: "2. Detailed Audit Log", range: "A24:H33" },
  { name: "hallucination", sheet: "3. Hallucination Detection", range: "A1:F36" },
  { name: "checklist", sheet: "4. Self-Assessment Checklist", range: "A1:D30" },
];

const summary = await workbook.inspect({
  kind: "table",
  sheetId: "1. Metadata & Summary",
  range: "A3:E27",
  include: "values,formulas",
  tableMaxRows: 30,
  tableMaxCols: 6,
  maxChars: 16000,
});
console.log("=== METADATA ===");
console.log(summary.ndjson);

const detail = await workbook.inspect({
  kind: "table",
  sheetId: "2. Detailed Audit Log",
  range: "A3:H33",
  include: "values,formulas",
  tableMaxRows: 35,
  tableMaxCols: 8,
  tableMaxCellChars: 400,
  maxChars: 50000,
});
console.log("=== DETAIL ===");
console.log(detail.ndjson);

const hallucinations = await workbook.inspect({
  kind: "table",
  sheetId: "3. Hallucination Detection",
  range: "A1:F8",
  include: "values,formulas",
  tableMaxRows: 10,
  tableMaxCols: 6,
  tableMaxCellChars: 700,
  maxChars: 20000,
});
console.log("=== HALLUCINATIONS ===");
console.log(hallucinations.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "^(#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A)$",
  options: { useRegex: true, maxResults: 200 },
  summary: "exact formula error scan",
});
console.log("=== FORMULA ERRORS ===");
console.log(errors.ndjson);

for (const check of checks) {
  const preview = await workbook.render({
    sheetName: check.sheet,
    range: check.range,
    scale: 0.9,
    format: "png",
  });
  await fs.writeFile(path.join(previewDir, `${check.name}.png`), new Uint8Array(await preview.arrayBuffer()));
}
console.log(previewDir);
