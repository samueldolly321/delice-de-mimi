/**
 * Impression d'un ticket de caisse (rouleau thermique 80 mm ou 58 mm).
 *
 * Le ticket est copié seul dans un cadre invisible, avec une page qui fait
 * exactement la largeur du rouleau et la longueur du ticket : pas de format
 * A4, pas de papier blanc imprimé après la facture.
 */

export type ReceiptPaperWidth = 80 | 58;

const PAPER_KEY = 'saveurs_receipt_paper_width';

export function getSavedPaperWidth(): ReceiptPaperWidth {
  return localStorage.getItem(PAPER_KEY) === '58' ? 58 : 80;
}

export function savePaperWidth(width: ReceiptPaperWidth): void {
  localStorage.setItem(PAPER_KEY, String(width));
}

/** Le ticket est mis en page sur 80 mm, puis réduit pour le rouleau de 58 mm. */
const LAYOUT_WIDTH_MM = 80;
const PX_PER_MM = 96 / 25.4;

function receiptCss(paperWidth: ReceiptPaperWidth): string {
  const zoom = paperWidth / LAYOUT_WIDTH_MM;
  return `
    html, body { margin: 0; padding: 0; background: #fff; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    #facture-n8-container {
      width: ${LAYOUT_WIDTH_MM}mm !important;
      max-width: ${LAYOUT_WIDTH_MM}mm !important;
      margin: 0 !important;
      padding: 3mm 4mm 5mm !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      box-sizing: border-box !important;
      background: #fff !important;
      font-family: 'Courier New', Courier, monospace !important;
      ${zoom !== 1 ? `zoom: ${zoom};` : ''}
    }
    #facture-n8-container * {
      color: #000 !important;
      background-color: transparent !important;
      border-color: #000 !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
    .no-print { display: none !important; }
  `;
}

/** Attend le chargement des styles, images et polices du cadre (3 s maximum). */
async function waitForContent(doc: Document): Promise<void> {
  const deadline = Date.now() + 3000;
  const ready = () =>
    doc.readyState === 'complete' && Array.from(doc.images).every((img) => img.complete);
  while (!ready() && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 50));
  }
  try {
    await Promise.race([doc.fonts.ready, new Promise((r) => setTimeout(r, 1000))]);
  } catch {
    // polices non disponibles : on imprime quand même
  }
}

/** Imprime l'élément #elementId sur un rouleau de ticket de caisse. */
export async function printReceipt(elementId: string, paperWidth: ReceiptPaperWidth): Promise<void> {
  const source = document.getElementById(elementId);
  if (!source) return;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '0',
    bottom: '0',
    width: `${LAYOUT_WIDTH_MM}mm`,
    height: '10px',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) return;

    // Styles du site (Tailwind) : uniquement ceux du <head>.
    const styles = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    doc.open();
    doc.write(
      `<!doctype html><html lang="fr"><head><meta charset="utf-8"><base href="${document.baseURI}">` +
        `${styles}<style>${receiptCss(paperWidth)}</style></head>` +
        `<body>${source.outerHTML}</body></html>`
    );
    doc.close();

    await waitForContent(doc);

    // Page = largeur du rouleau × longueur exacte du ticket.
    const ticket = doc.getElementById(elementId);
    const heightPx = ticket ? ticket.getBoundingClientRect().height : 0;
    const heightMm = Math.max(40, Math.ceil(heightPx / PX_PER_MM) + 4);
    const pageStyle = doc.createElement('style');
    pageStyle.textContent = `@page { size: ${paperWidth}mm ${heightMm}mm; margin: 0; }`;
    doc.head.appendChild(pageStyle);

    win.focus();
    win.print();
  } finally {
    // print() bloque jusqu'à la fermeture de la fenêtre d'impression.
    setTimeout(() => iframe.remove(), 1000);
  }
}
