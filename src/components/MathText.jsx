import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Escape HTML special characters in non-math segments
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to ensure LaTeX formulas have standard delimiters
export function normalizeMathDelimiters(str) {
  if (!str || typeof str !== 'string') return str;

  let content = str
    .replace(/\( ([^)]+) \)/g, '\\($1\\)')
    .replace(/\[ ([^\]]+) \]/g, '\\[$1\\]');

  // If the content already has standard LaTeX delimiters, return as-is
  if (content.includes('$') || content.includes('\\(') || content.includes('\\[') || content.includes('\\begin{')) {
    return content;
  }

  const hasLatexCommands = /(\\[a-zA-Z]+|\^\{|\_\{|\^[\d\w]|\_[\d\w])/.test(content);
  if (!hasLatexCommands) {
    return content;
  }

  // If the entire string is a math expression (e.g. 10^{10}, 2.5 \times 10^{19}, x^2 + y^2 = r^2, \frac{a}{b})
  const isPureMath = /^[\d\s\.\,\+\-\*\/\=\<\>\(\)\[\]\{\}\^\_\\]+$/.test(content);
  if (isPureMath) {
    return `$${content.trim()}$`;
  }

  // If text contains isolated LaTeX macros like \Phi(x, y, z), \times, \frac{...}{...}, wrap them in $...$
  content = content.replace(/(\\[a-zA-Z]+(?:\{[^{}]*\}|\([^)()]*\)|\[[^[\]]*\])*)/g, (match) => {
    return `$${match}$`;
  });

  return content;
}

// Convert mixed text + math string into KaTeX HTML
export function renderWithKatex(rawStr, inline = false) {
  if (!rawStr || typeof rawStr !== 'string') return '';

  let str = normalizeMathDelimiters(rawStr);

  // Match $$...$$, $...$, \[...\], \(...\)
  const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;

  let lastIndex = 0;
  let html = '';
  let match;

  while ((match = mathRegex.exec(str)) !== null) {
    // Text before match
    const textBefore = str.substring(lastIndex, match.index);
    if (textBefore) {
      html += escapeHtml(textBefore);
    }

    const fullMatch = match[0];
    const isDisplay = fullMatch.startsWith('$$') || fullMatch.startsWith('\\[');
    let formula = '';

    if (fullMatch.startsWith('$$')) {
      formula = fullMatch.slice(2, -2);
    } else if (fullMatch.startsWith('$')) {
      formula = fullMatch.slice(1, -1);
    } else if (fullMatch.startsWith('\\[')) {
      formula = fullMatch.slice(2, -2);
    } else if (fullMatch.startsWith('\\(')) {
      formula = fullMatch.slice(2, -2);
    }

    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: isDisplay && !inline,
        throwOnError: false,
        strict: false
      });
      html += rendered;
    } catch {
      html += escapeHtml(fullMatch);
    }

    lastIndex = mathRegex.lastIndex;
  }

  // Trailing text after last match
  const remaining = str.substring(lastIndex);
  if (remaining) {
    html += escapeHtml(remaining);
  }

  return html;
}

// Context provider component (kept for backward compatibility with App.jsx)
export function MathProvider({ children }) {
  return <>{children}</>;
}

// Main MathText component using KaTeX
export default function MathText({ children, inline = false, className = '' }) {
  if (!children && children !== 0) return null;

  const content = typeof children === 'string' ? children : String(children);

  const renderedHtml = useMemo(() => {
    return renderWithKatex(content, inline);
  }, [content, inline]);

  return (
    <span
      className={`math-text ${inline ? 'inline' : 'inline-block'} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}