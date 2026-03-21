# Diploma PDF text placement

Dynamic fields (child name, nivo label, ceremony date, optional imam line) are drawn **on top of** a template PDF. Positions are configured in the app (**Community → Diplomas** for `ADMIN` / `SUPER_ADMIN`), not read from the PDF file.

## Community configuration (primary)

1. Open **Community** and the **Diplomas** tab.
2. Optionally **upload a PDF** template for that community (or use the default Mekteb background).
3. Use the **preview**: choose **Name / Nivo / Date / Imam**, then **click** to set **X** (left edge from the page’s left) and **Y** (baseline from the bottom), in PDF points like `pdf-lib`. Leave **X** empty to center that line horizontally. **Sample output** below renders a one-page PDF with fixed placeholder text through the same generator as real diplomas.
4. Expand **Typography, spacing, and colors** for fonts, gaps, and RGB (0–1).
5. Set an optional **default imam line** and click **Save layout and defaults** (stored per community in the database).

## Code defaults

[`diploma-layout.ts`](./diploma-layout.ts) defines **`DIPLOMA_TEXT_LAYOUT`**: used when a community has **no** saved layout JSON yet, and as the base merged with saved JSON.

### Coordinate system (`pdf-lib`)

- Origin is the **bottom-left** corner of the page.
- **X** increases to the right.
- **Y** increases **upward**.
- Units are **points** (72 pt = 1 inch). Portrait A4 is usually **595 × 842** pt; **landscape** swaps those numbers.

### Placement modes

1. **`stacked` (default)** — set **`nameBaselineFromBottomPt`**; nivo and date are computed below the name using `lineHeightFactor` and gaps. **Imam** uses **`imamBaselineFromBottomPt`** separately.

2. **`absolute`** — set each baseline field independently.

### Generation

**Community → Diplomas**: keep **template and layout** on the tab; use **Generate diplomas** to open a **dialog** where you fill in ceremony date, nivo filter, optional **custom nivo line** when filtering by one nivo (e.g. “Prvi nivo” instead of “Nivo 1”), imam override, and child selection, then **Generate & download**. The merged PDF is built **in the browser** (`pdf-lib`); only settings are stored on the server, not generated PDFs.
