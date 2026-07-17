import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workDir = "E:/swp391-rbl-project-se20a01_team3/.codex-work/audit-log";
const sheets = [
  { name: "1. Metadata & Summary", range: "A1:E27" },
  { name: "2. Detailed Audit Log", range: "A1:H18" },
  { name: "3. Hallucination Detection", range: "A1:F36" },
  { name: "4. Self-Assessment Checklist", range: "A1:D30" },
];
const sources = [
  { label: "target", file: "E:/AI/AIAuditLogSWP.xlsx" },
  { label: "sample", file: "E:/swp391-rbl-project-se20a01_team3/AI Audig Log.xlsx" },
];

for (const source of sources) {
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(source.file));
  const detail = [];
  for (const spec of sheets) {
    const table = await workbook.inspect({
      kind: "table",
      sheetId: spec.name,
      range: spec.range,
      include: "values,formulas",
      tableMaxRows: 40,
      tableMaxCols: 10,
      tableMaxCellChars: 2000,
      maxChars: 80000,
    });
    const formulas = await workbook.inspect({
      kind: "formula",
      sheetId: spec.name,
      range: spec.range,
      options: { maxResults: 100 },
      maxChars: 12000,
    });
    const styles = await workbook.inspect({
      kind: "computedStyle",
      sheetId: spec.name,
      range: spec.range,
      maxChars: 15000,
    });
    detail.push(`=== ${spec.name} TABLE ===\n${table.ndjson}`);
    detail.push(`=== ${spec.name} FORMULAS ===\n${formulas.ndjson}`);
    detail.push(`=== ${spec.name} STYLES ===\n${styles.ndjson}`);

    const preview = await workbook.render({
      sheetName: spec.name,
      range: spec.range,
      scale: 1,
      format: "png",
    });
    const safeName = spec.name.replace(/[^A-Za-z0-9]+/g, "_");
    await fs.writeFile(
      path.join(workDir, `${source.label}_${safeName}.png`),
      new Uint8Array(await preview.arrayBuffer()),
    );
  }
  await fs.writeFile(path.join(workDir, `${source.label}_detail.txt`), detail.join("\n\n"), "utf8");
  console.log(`${source.label}: rendered and inspected ${sheets.length} sheets`);
}
