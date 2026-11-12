# Smart CEMS – Project Documentation Index

**Project:** Smart CEMS – Smart College Event Management System  
**Institution:** Rajiv Gandhi University of Knowledge Technologies (RGUKT) – IIIT RK Valley  
**Department:** Computer Science and Engineering (B.Tech CSE – Software Engineering Lab)

---

## Contents of `documentation/`

| Deliverable File / Folder | Format | Description |
| :--- | :--- | :--- |
| [`Smart_CEMS_Project_Report.docx`](Smart_CEMS_Project_Report.docx) | Microsoft Word (`.docx`) | Complete 14-chapter editable B.Tech Software Engineering report (Cover Page, TOC, List of Figures, List of Tables, Chapters 1–14, embedded technical diagrams, real screenshots, syntax-formatted code snippets, and verified test summaries). |
| [`Smart_CEMS_Project_Report.pdf`](Smart_CEMS_Project_Report.pdf) | PDF Document (`.pdf`) | Final formatted A4 printable PDF report with page numbers, running headers/footers, embedded diagrams, and real UI screenshots. |
| [`Smart_CEMS_SRS.md`](Smart_CEMS_SRS.md) | Markdown (`.md`) | Standalone IEEE-style Software Requirements Specification covering stakeholder, functional (`FR-01`–`FR-24`), non-functional (`NFR-01`–`NFR-05`), external interface, and security requirements. |
| [`Smart_CEMS_API_Documentation.md`](Smart_CEMS_API_Documentation.md) | Markdown (`.md`) | Verified REST API (`Node/Express` :5000) and AI Microservice (`Python` :5001) specification with exact routes, parameters, validation regexes, status codes, and response shapes. |
| [`Smart_CEMS_Database_Documentation.md`](Smart_CEMS_Database_Documentation.md) | Markdown (`.md`) | Documentation of both runtime JSON storage (`backend/data/*.json`) and designed PostgreSQL/Supabase schema (`database/schema.sql`), including constraints, relationships, normalization analysis, and fictional sample records. |
| [`Smart_CEMS_Test_Cases.xlsx`](Smart_CEMS_Test_Cases.xlsx) | Excel Workbook (`.xlsx`) | Multi-sheet test suite covering Unit, Integration, System, Functional, Validation, Security, and User Acceptance Testing (UAT), separating executed test evidence (`PASS`) from unexecuted manual tests (`Not Tested`). |
| [`diagrams/`](diagrams/) | `.mmd`, `.drawio`, `.png`, `.svg` | Editable Mermaid (`.mmd`) and diagrams.net (`.drawio`) technical sources paired with high-resolution SVG and PNG renders for all 13 architecture, DFD, ER, UML, and workflow diagrams. |
| [`screenshots/`](screenshots/) | PNG Images (`.png`) | Real screenshots captured directly from headless Google Chrome running against the live Smart CEMS application (`http://localhost:5000`). |

---

## How to Use & Edit

- **Viewing the Report:** Open `Smart_CEMS_Project_Report.pdf` in any PDF viewer for submission or print, or open `Smart_CEMS_Project_Report.docx` in LibreOffice Writer / Microsoft Word to adjust university header details or page formatting.
- **Editing Technical Diagrams:** Open any `.drawio` file in diagrams.net (draw.io desktop or web) or inspect/render any `.mmd` file with Mermaid Live Editor (`mermaid.live`) or VS Code Mermaid Preview. High-resolution `.png` and vector `.svg` exports sit beside every source file in `documentation/diagrams/`.
- **Inspecting Test Results:** Open `Smart_CEMS_Test_Cases.xlsx` in LibreOffice Calc or Microsoft Excel to review test suites (`Summary`, `API & Integration Tests`, `Validation & Security`, `UI & UAT Tests`).
