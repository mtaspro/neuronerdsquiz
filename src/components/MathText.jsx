import React from 'react';
import { MathJax, MathJaxContext } from 'better-react-mathjax';

// MathJax configuration
const mathJaxConfig = {
  loader: { load: ['[tex]/html'] },
  tex: {
    packages: { '[+]': ['html'] },
    inlineMath: [['$', '$'], ['\\(', '\\)'], ['( ', ' )']],
    displayMath: [['$$', '$$'], ['\\[', '\\]'], ['[ ', ' ]']],
    processEscapes: true,
    processEnvironments: true
  },
  options: {
    ignoreHtmlClass: 'tex2jax_ignore',
    processHtmlClass: 'tex2jax_process'
  }
};

// Context provider component
export function MathProvider({ children }) {
  return (
    <MathJaxContext config={mathJaxConfig}>
      {children}
    </MathJaxContext>
  );
}

// Helper to ensure LaTeX formulas have standard MathJax delimiters
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

// Main MathText component
export default function MathText({ children, inline = false, className = "" }) {
  if (!children) return null;
  
  let content = typeof children === 'string' ? children : String(children);
  content = normalizeMathDelimiters(content);
  
  // Convert NeuraX format to standard LaTeX delimiters
  content = content
    .replace(/\( ([^)]+) \)/g, '\\($1\\)')
    .replace(/\[ ([^\]]+) \]/g, '\\[$1\\]');
  
  return (
    <MathJax 
      inline={inline} 
      className={`math-text ${className}`}
    >
      {content}
    </MathJax>
  );
}