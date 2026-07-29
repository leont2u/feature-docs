/**
 * Minimal Python source tokenizer shared by all Django file parsers.
 *
 * Regex-per-physical-line breaks on real-world Django code, where a single
 * field/call is routinely spread across many lines:
 *
 *   user = models.OneToOneField(
 *       "authentication.CustomUser",
 *       on_delete=models.CASCADE,
 *   )
 *
 * toLogicalLines() merges continuation lines (based on paren/bracket/brace
 * depth) into single "logical lines" so a downstream parser can match a
 * whole statement with one regex regardless of how it's wrapped. It also
 * correctly skips over string contents (including triple-quoted docstrings)
 * so quotes/parens/brackets inside comments or strings never affect depth
 * tracking or line splitting.
 */
export interface LogicalLine {
  /** Full statement text, original internal newlines preserved. */
  text: string;
  /** Leading whitespace width (tabs counted as one column) of the first physical line. */
  indent: number;
  /** 1-indexed source line where this logical line begins. */
  startLineNumber: number;
}

export function toLogicalLines(source: string): LogicalLine[] {
  const lines: LogicalLine[] = [];
  const n = source.length;
  let i = 0;
  let lineNumber = 1;
  let depth = 0;
  let bufferStart = 0;
  let bufferStartLine = 1;

  const flush = (end: number): void => {
    const text = source.slice(bufferStart, end);
    if (text.trim() !== '') {
      lines.push({ text: text.replace(/\s+$/, ''), indent: leadingWidth(text), startLineNumber: bufferStartLine });
    }
    bufferStart = end;
    bufferStartLine = lineNumber;
  };

  while (i < n) {
    const ch = source[i];

    if ((ch === '"' || ch === "'") && source.startsWith(ch.repeat(3), i)) {
      const quote = ch.repeat(3);
      const end = source.indexOf(quote, i + 3);
      const segment = end === -1 ? source.slice(i) : source.slice(i, end + 3);
      lineNumber += countNewlines(segment);
      i = end === -1 ? n : end + 3;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < n && source[j] !== quote && source[j] !== '\n') {
        j += source[j] === '\\' ? 2 : 1;
      }
      i = Math.min(j + 1, n);
      continue;
    }

    if (ch === '#') {
      const end = source.indexOf('\n', i);
      i = end === -1 ? n : end;
      continue;
    }

    if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth = Math.max(0, depth - 1);
    }

    if (ch === '\n') {
      lineNumber++;
      if (depth === 0) {
        flush(i + 1);
      }
    }

    i++;
  }

  if (bufferStart < n) {
    flush(n);
  }

  return lines;
}

function countNewlines(text: string): number {
  let count = 0;
  for (const ch of text) {
    if (ch === '\n') count++;
  }
  return count;
}

function leadingWidth(text: string): number {
  const match = /^[ \t]*/.exec(text);
  return match ? match[0].replace(/\t/g, '    ').length : 0;
}

/** Returns the index one past the end of the block starting at bodyStart (first line with indent <= headerIndent, or lines.length). */
export function findBlockEnd(lines: LogicalLine[], bodyStart: number, headerIndent: number): number {
  for (let j = bodyStart; j < lines.length; j++) {
    if (lines[j].indent <= headerIndent) {
      return j;
    }
  }
  return lines.length;
}

/** The shallowest indent among lines in [start, end) — i.e. the indent of that block's direct members. */
export function directMemberIndent(lines: LogicalLine[], start: number, end: number): number | undefined {
  let min: number | undefined;
  for (let j = start; j < end; j++) {
    if (min === undefined || lines[j].indent < min) {
      min = lines[j].indent;
    }
  }
  return min;
}
