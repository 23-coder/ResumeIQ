import PDFParser from 'pdf2json';

interface PdfParserInstance {
  on: (event: string, callback: (data: unknown) => void) => void;
  parseBuffer: (buffer: Buffer) => void;
  getRawTextContent: () => string;
}

type PdfParserConstructor = new (_unused?: unknown, rawText?: boolean) => PdfParserInstance;

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const ParserClass = PDFParser as unknown as PdfParserConstructor;
    const pdfParser = new ParserClass(undefined, true);

    pdfParser.on('pdfParser_dataReady', () => {
      const text = pdfParser.getRawTextContent();
      console.log('Extracted text length:', text?.length, 'Preview:', text?.substring(0, 200));
      if (!text || text.trim().length < 10) {
        reject(new Error('Could not extract sufficient text from the PDF'));
      } else {
        resolve(text.trim());
      }
    });

    pdfParser.on('pdfParser_dataError', (errData: unknown) => {
      const error = errData as { parserError?: Error; message?: string };
      console.error('PDF2JSON error:', error);
      reject(new Error('Failed to extract text from PDF. Please ensure the file is a valid PDF with readable text.'));
    });

    try {
      pdfParser.parseBuffer(buffer);
    } catch (error) {
      console.error('PDF parseBuffer error:', error);
      reject(new Error('Failed to extract text from PDF. Please ensure the file is a valid PDF.'));
    }
  });
}
