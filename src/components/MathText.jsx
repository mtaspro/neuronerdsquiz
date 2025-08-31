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

// Main MathText component
export default function MathText({ children, inline = false, className = "" }) {
  if (!children) return null;
  
  let content = typeof children === 'string' ? children : String(children);
  
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