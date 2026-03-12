import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() {}

  async generatePdf(jsonData: any[]) {
    const doc = new jsPDF("landscape");

    // A dokumentum magassága és szélessége.
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Minden belépéshez kezdeti függőleges pozíció.
    let yPosition = 10;

    // Végigmenni a bejegyzéseken.
    for (const entry of jsonData)
    {
      // Ellenőrizni, hogy van-e elég hely a következő bejegyzéshez.
      if (yPosition + 90 > pageHeight) {
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
            // A kép eredeti magassága és szélessége
            const imgWidth = img.width;
            const imgHeight = img.height;

            // A kép maximum pagasságának és szélességének beállítása.
            const maxWidth = pageWidth / 2;
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
            doc.addImage(img, 'PNG', 10, yPosition, scaledWidth, scaledHeight); // Image at (10, yPosition)
            resolve();
          };
        });
      }

      // A szöveg elhelyezkedésének beállítása.
      const textX = 10;
      const textYTitle = yPosition + scaledHeight + 10;
      const textYTime = textYTitle + 10;

      // Cím hozzáadása.
      const titleLines = doc.splitTextToSize(entry.title, pageWidth / 2);
      doc.setFontSize(20);
      doc.text(titleLines, textX, textYTitle);

      // Időbélyeg hozzáadása.
      const timestampLines = doc.splitTextToSize(`${entry.timestamp}`, pageWidth / 2);
      doc.setFontSize(14);
      doc.text(timestampLines, textX, textYTime);

      // Jegyzet hozzáadása.
      const noteLines = doc.splitTextToSize(`${entry.note}`, pageWidth / 2 - 20);
      doc.setFontSize(14);
      doc.text(noteLines, pageWidth / 2 + 15, yPosition + 5);

      // A következő bejegyzés miatt (hogy legyen elég hely közöttük) a kezdeti függőleges pozíció felülírása.
      yPosition += Math.max(scaledHeight + 60, 90) + 10;
    }

    // A PDF elmentése.
    doc.save("note.pdf");
  }
}
