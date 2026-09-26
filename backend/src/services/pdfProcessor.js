const fs = require('fs');
const pdf = require('pdf-parse');

/**
 * Extracts text page-by-page from a PDF file.
 * @param {string} filePath - Absolute path to the PDF.
 * @returns {Promise<{pageCount: number, pages: Array<{pageNumber: number, text: string}>, fullText: string}>}
 */
async function extractPagesFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pages = [];
  let pageCounter = 1;

  const customPagerender = function (pageData) {
    const pageNumber = pageCounter++;
    return pageData.getTextContent().then((textContent) => {
      let lastY = null;
      let lastX = null;
      let lastWidth = 0;
      let lineBuffer = '';
      const lines = [];

      for (const item of textContent.items) {
        const x = item.transform[4];
        const y = item.transform[5];
        const str = item.str;
        if (!str || (str.trim().length === 0 && item.width === 0)) continue;

        if (lastY === null) {
          lineBuffer = str;
        } else if (Math.abs(y - lastY) > 3) {
          // New line break
          if (lineBuffer.trim().length > 0) {
            lines.push(lineBuffer.trim());
          }
          lineBuffer = str;
        } else {
          // Same horizontal line: calculate distance between previous item and current
          const gap = x - (lastX + lastWidth);
          if (lineBuffer.endsWith(' ') || str.startsWith(' ')) {
            lineBuffer += str;
          } else if (gap > 2.0) {
            lineBuffer += ' ' + str;
          } else {
            lineBuffer += str;
          }
        }
        lastY = y;
        lastX = x;
        lastWidth = item.width || 0;
      }

      if (lineBuffer.trim().length > 0) {
        lines.push(lineBuffer.trim());
      }

      // Filter lone noise characters (e.g. single stray letter floating at top/bottom)
      const cleanLines = lines.filter((l) => !(l.length === 1 && /[a-z]/i.test(l)));

      // Flow repair: join lines that are part of the same sentence (unwrap soft breaks)
      const unwrappedLines = [];
      for (let i = 0; i < cleanLines.length; i++) {
        let current = cleanLines[i];
        // If current line ends with a hyphen, connect with next word without hyphen
        if (current.endsWith('-') && i + 1 < cleanLines.length) {
          current = current.slice(0, -1) + cleanLines[i + 1].trim();
          i++; // Skip next line since it merged
        } else if (
          i + 1 < cleanLines.length &&
          !/[.:;!?]$/.test(current) &&
          !/^(\d+\.|[A-Z\s]{4,}|Chapter|Section)/.test(cleanLines[i + 1]) &&
          /^[a-z]/.test(cleanLines[i + 1])
        ) {
          // Next line starts with lowercase and current line doesn't end with sentence terminator: merge with space
          current = current + ' ' + cleanLines[i + 1].trim();
          i++; // Skip next line
        }
        unwrappedLines.push(current);
      }

      const cleanText = unwrappedLines
        .join('\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/(\w+)-\s+(\w+)/g, '$1-$2') // Fix hyphenation e.g. "low- cost" -> "low-cost"
        .replace(/\s+([.,;:!?])/g, '$1')     // Fix space before punctuation
        .trim();

      pages.push({ pageNumber, text: cleanText });
      return cleanText;
    });
  };

  const parsed = await pdf(dataBuffer, {
    pagerender: customPagerender,
  });

  // Fallback if custom pagerender did not capture pages cleanly
  if (pages.length === 0) {
    const rawPages = (parsed.text || '').split('\f');
    rawPages.forEach((pText, idx) => {
      const clean = pText.replace(/\s+/g, ' ').trim();
      if (clean) {
        pages.push({ pageNumber: idx + 1, text: clean });
      }
    });
  }

  // Ensure page numbers match ascending order
  pages.sort((a, b) => a.pageNumber - b.pageNumber);

  return {
    pageCount: parsed.numpages || pages.length || 1,
    pages,
    fullText: parsed.text || pages.map((p) => p.text).join('\n\n'),
  };
}

/**
 * Splits extracted pages into overlapping semantic chunks with page metadata.
 * Ensures chunk start and end boundaries are strictly aligned to whole words/sentences.
 * @param {Array<{pageNumber: number, text: string}>} pages
 * @param {Object} options - { chunkSize: number, chunkOverlap: number }
 * @returns {Array<{pageNumber: number, chunkIndex: number, text: string, tokenCount: number, metadata: Object}>}
 */
function chunkPages(pages, options = {}) {
  const chunkSize = options.chunkSize || 650; // Target chunk size in characters
  const chunkOverlap = options.chunkOverlap || 100; // Overlap in characters

  const allChunks = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const text = page.text;
    if (!text || text.trim().length === 0) continue;

    // If page content is smaller than chunk size, create a single chunk
    if (text.length <= chunkSize) {
      allChunks.push({
        pageNumber: page.pageNumber,
        chunkIndex: globalChunkIndex++,
        text: text.trim(),
        tokenCount: Math.ceil(text.length / 4),
        metadata: {
          startChar: 0,
          endChar: text.length,
        },
      });
      continue;
    }

    // Sliding window chunking with whole-word and sentence boundary alignment
    let start = 0;
    while (start < text.length) {
      let end = start + chunkSize;

      if (end < text.length) {
        // Look for sentence end (. or ? or ! followed by whitespace)
        let boundary = -1;
        for (let i = end; i >= Math.max(start + 120, end - 150); i--) {
          if (['.', '!', '?', '\n'].includes(text[i]) && (i + 1 >= text.length || /\s/.test(text[i + 1]))) {
            boundary = i + 1;
            break;
          }
        }

        if (boundary !== -1) {
          end = boundary;
        } else {
          // Snap to the nearest whole word boundary (space)
          const spaceIdx = text.lastIndexOf(' ', end);
          if (spaceIdx > start + 80) {
            end = spaceIdx;
          }
        }
      } else {
        end = text.length;
      }

      const chunkText = text.substring(start, end).trim();
      if (chunkText.length > 20) {
        allChunks.push({
          pageNumber: page.pageNumber,
          chunkIndex: globalChunkIndex++,
          text: chunkText,
          tokenCount: Math.ceil(chunkText.length / 4),
          metadata: {
            startChar: start,
            endChar: end,
          },
        });
      }

      if (end >= text.length) break;

      // Advance start: snap to the beginning of the next whole word
      let nextStart = Math.max(start + 1, end - chunkOverlap);
      const nextSpace = text.indexOf(' ', nextStart);
      if (nextSpace !== -1 && nextSpace < end) {
        nextStart = nextSpace + 1;
      }
      start = nextStart;
    }
  }

  return allChunks;
}

module.exports = {
  extractPagesFromPdf,
  chunkPages,
};
