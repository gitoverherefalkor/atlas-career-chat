
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .filter((item): item is any => 'str' in item)
        .map(item => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

export const extractTextFromFile = async (file: File): Promise<string> => {
  if (file.type === 'application/pdf') {
    return await extractTextFromPDF(file);
  } else if (file.type === 'text/plain') {
    return await file.text();
  } else if (file.type.includes('word')) {
    throw new Error('Word documents not supported yet. Please convert to PDF.');
  } else {
    throw new Error('Unsupported file type');
  }
};
