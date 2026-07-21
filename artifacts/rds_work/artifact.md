# Bee Academy RDS template contract

## Reference

- Source: `E:\swp391-rbl-project-se20a01_team3\artifacts\rds_work\Group3_BeeAcademy_RDS_source.docx`
- SHA-256: `FAFB7B6DD54A1D877D19DB285D9DAF59D4D37A1906BB52749BCD47BBB9D5E468`
- Cached page count: 127 (`docProps/app.xml`); 885 body paragraphs, 164 tables, 59 inline images.
- Sections: 1.
- Evidence: `source_inventory.json`, `source_style_evidence.json`, section/style/heading/image/field audits executed on 2026-07-21.
- Visual render: packaged renderer unavailable because LibreOffice is not installed. Microsoft Word PDF export was attempted but did not complete; structural evidence is the authoritative fallback.

## Page system

- A4 portrait, 8.27 x 11.69 inches.
- Margins: 1.00 inch on all sides.
- One continuous document section; section start type NEW_PAGE.
- Empty header and footer; no different-first-page or odd/even-page variants.
- Existing page breaks, image sizes, and section geometry are preserve-only.

## Typography and hierarchy

- Base family: Times New Roman (document-wide direct formatting and inherited style font).
- Heading 1: 20 pt; Heading 2: 16 pt; Heading 3: 14 pt; Heading 4: 12 pt.
- Body, tables, cover, TOC, captions, and SQL examples must reuse the source paragraph/run properties rather than introduce a second style system.
- New requirement-design subsections use real Heading 3 and Heading 4 styles so Word can refresh the TOC.

## Lists, tables, and components

- Tables use the source Table Grid-derived formatting, merged-cell patterns, borders, shading, cell margins, and paragraph rhythm.
- New UI-design tables clone the existing three-column `Field Name | Field Type | Description` pattern.
- New database-access tables clone the existing three-column `Table | CRUD | Description` pattern.
- Appendix tables reuse the existing three-column business-rule table pattern.
- Existing drawings and relationships are preserve-only. New sections do not duplicate an unrelated screenshot.
- TOC consists of cached TOC paragraphs and PAGEREF fields. The final package must set `w:updateFields=true` so Word refreshes newly inserted headings and page numbers on open.

## Content flow and editable slots

- Preserve: cover layout, existing Overview, all 44 Requirement Specifications, existing 34 Design Specification subsections, existing figures, and all recurring formatting.
- Modify: cover version/date, Record of Changes, Non-UI Functions, implemented database table inventory, Code Packages, incomplete Design Specifications, and Appendix placeholders.
- Insert Design Specification subsections at the missing numeric positions: UC16, UC18, UC20, UC22, UC23, UC35, UC37, UC39, UC40, and UC43.
- Replace Appendix template/sample text with Bee Academy assumptions/dependencies, limitations/exclusions, business rules, and code traceability.
- Stable locators are heading text and the immediately following table/paragraph sequence in `word/document.xml`; table numbers in `source_inventory.json` are supporting evidence only.

## Package preservation

- Preserve all ZIP parts and relationships except `word/document.xml`, `word/settings.xml`, and metadata parts whose cached counts may change during authoring.
- Preserve `word/media/*`, themes, styles, numbering, headers, footers, comments, relationships, embedded objects, and custom XML byte-for-byte.
- The source file itself must remain byte-for-byte unchanged.

## Fidelity gates

- Source SHA-256 remains unchanged.
- Final remains A4 portrait with one section and identical margins.
- 59 source inline images and their relationships remain present.
- Heading styles, table formatting, and existing content remain source-derived.
- No placeholder instructions, sample cafeteria rules, `4. ..`, blank package rows, or mojibake text remain in the edited areas.
- No duplicate relationship IDs, bookmarks, paragraph IDs, or drawing IDs are introduced by cloned nodes.
- Structural audits pass; visual QA is attempted again and, if still unavailable, disclosed to the user.
