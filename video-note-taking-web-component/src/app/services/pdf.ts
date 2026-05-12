import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() {}

  // TODO: felhasználói élmény: a jegyzet formázottan történő elmentésére is legyen lehetőség
  /**
   * Egy PDF fájl generálása a jegyzetből.
   * @param jsonData - A jegyzet JSON fájl formátumban.
   */
  async generatePDF(jsonData: any[])
  {
    const doc = new jsPDF();

    // A dokumentum magassága és szélessége.
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Minden belépéshez kezdeti függőleges pozíció.
    let yPosition = 10;

    // Sor magassága.
    const lineHeight = 6;

    // Végigmenni a bejegyzéseken.
    for (const entry of jsonData)
    {
      // A szükséges magasság kiszámítása a bejegyzéshez.
      const requiredHeight = this.getTextHeight(doc, entry.note, pageWidth);

      // Ellenőrizni, hogy van-e elég hely a következő bejegyzéshez.
      if (yPosition + requiredHeight > pageHeight)
      {
        // Ha nincs akkor adjon hozzá egy új oldalt a dokumentumhoz.
        doc.addPage();
        // A tetejére újra beállítani a kezdeti függőleges pozíciót.
        yPosition = 10;
      }

      // A képhez a magasság és szélesség.
      let scaledWidth = 0;
      let scaledHeight = 0;

      // A kép hozzáadása.
      if (entry.thumbnail)
      {
        // Egy új kép létrehozása.
        const img = new Image();
        img.src = entry.thumbnail;

        // A Promise-al megvárni a kép betöltését.
        await new Promise<void>((resolve) =>
        {
          img.onload = () =>
          {
            // A kép eredeti magassága és szélessége.
            const imgWidth = img.width;
            const imgHeight = img.height;

            // A kép maximum pagasságának és szélességének beállítása.
            const maxWidth = pageWidth / 3;
            const maxHeight = pageHeight - yPosition;

            // A képarány megtartása.
            if (imgWidth > maxWidth || imgHeight > maxHeight)
            {
              const widthRatio = maxWidth / imgWidth;
              const heightRatio = maxHeight / imgHeight;
              const minRatio = Math.min(widthRatio, heightRatio);

              scaledWidth = imgWidth * minRatio;
              scaledHeight = imgHeight * minRatio;
            }
            else
            {
              // Ha a kép az kisebb mint a maximum méret.
              scaledWidth = imgWidth;
              scaledHeight = imgHeight;
            }

            // A kép hozzáadása a dokumentumhoz.
            doc.addImage(img, 'PNG', 10, yPosition, scaledWidth, scaledHeight);
            resolve();
          };
        });
      }

      // Cím hozzáadása.
      const titleLines = doc.splitTextToSize(entry.title, pageWidth / 2 - 22);
      doc.setFontSize(20);
      doc.text(titleLines, pageWidth / 3 + 15, yPosition + 8);

      // Időbélyeg hozzáadása.
      const timestampLines = doc.splitTextToSize(`${entry.timestamp}`, pageWidth / 2 - 22);
      doc.setFontSize(14);
      doc.text(timestampLines, pageWidth / 3 + 15, yPosition + 27);

      // Jegyzet hozzáadása.
      const noteLines = doc.splitTextToSize(`${entry.note}`, pageWidth - 22);
      doc.setFontSize(14);
      const noteYPosition = yPosition + scaledHeight + 10;
      doc.text(noteLines, 12, noteYPosition);

      // Frissíteni az yPosition-t a következő bejegyzéshez.
      yPosition = noteYPosition + (noteLines.length * lineHeight) + 10;

      // A következő bejegyzéssel ne folyjon össze.
      if (yPosition + 60 > pageHeight)
      {
        doc.addPage();
        yPosition = 10;
      }
    }

    // A PDF fájl mentése.
    doc.save('note.pdf');
  }

  private getTextHeight(doc: any, text: any, maxWidth: any, lineHeightFactor = 1.15, padding = 4)
  {
    // A szöveget a rendelkezésre álló szélességhez igazítja.
    const lines = doc.splitTextToSize(text, maxWidth);

    // Betűméret pontokban.
    const fontSize = doc.getFontSize();

    // Hozzávetőleges sortávolság (a jsPDF nem adja meg közvetlenül a magasságot képpontban; az 1,15 egy általános szorzó).
    const lineHeight = fontSize * lineHeightFactor;

    // A teljes magasság a dokumentummal megegyező mértékegységben (a beállításoktól függően alapértelmezés szerint "pt" vagy "mm").
    return lines.length * lineHeight + padding;
  }
}
