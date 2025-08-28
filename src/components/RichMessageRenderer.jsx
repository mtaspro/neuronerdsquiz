import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { FaCopy, FaCheck, FaExternalLinkAlt } from 'react-icons/fa';
import 'katex/dist/katex.min.css';

const RichMessageRenderer = ({ content, className = '' }) => {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const components = {
    // Enhanced code blocks with syntax highlighting and copy functionality
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeString = String(children).replace(/\n$/, '');
      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

      if (!inline && language) {
        return (
          <div className="relative group my-4">
            <div className="flex items-center justify-between bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-t-lg border border-gray-600/30">
              <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                {language}
              </span>
              <button
                onClick={() => copyToClipboard(codeString, codeId)}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-600/50 rounded transition-colors"
              >
                {copiedCode === codeId ? (
                  <>
                    <FaCheck className="text-green-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <FaCopy />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <SyntaxHighlighter
              style={oneDark}
              language={language}
              PreTag="div"
              className="!mt-0 !rounded-t-none border border-t-0 border-gray-600/30"
              customStyle={{
                margin: 0,
                borderRadius: '0 0 0.5rem 0.5rem',
                background: 'rgba(17, 24, 39, 0.8)',
                backdropFilter: 'blur(8px)',
              }}
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      }

      // Inline code
      return (
        <code
          className="px-1.5 py-0.5 bg-gray-800/60 text-blue-300 rounded text-sm font-mono border border-gray-600/30"
          {...props}
        >
          {children}
        </code>
      );
    },

    // Enhanced tables with better styling
    table({ children }) {
      return (
        <div className="my-4 overflow-x-auto">
          <table className="min-w-full bg-gray-900/30 backdrop-blur-sm border border-gray-600/30 rounded-lg overflow-hidden">
            {children}
          </table>
        </div>
      );
    },

    thead({ children }) {
      return (
        <thead className="bg-gray-800/50">
          {children}
        </thead>
      );
    },

    th({ children }) {
      return (
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider border-b border-gray-600/30">
          {children}
        </th>
      );
    },

    td({ children }) {
      return (
        <td className="px-4 py-3 text-sm text-gray-300 border-b border-gray-700/30">
          {children}
        </td>
      );
    },

    // Enhanced headings with better styling
    h1({ children }) {
      return (
        <h1 className="text-2xl font-bold text-white mb-4 mt-6 pb-2 border-b border-gray-600/30">
          {children}
        </h1>
      );
    },

    h2({ children }) {
      return (
        <h2 className="text-xl font-semibold text-gray-100 mb-3 mt-5 flex items-center">
          <span className="mr-2">🔹</span>
          {children}
        </h2>
      );
    },

    h3({ children }) {
      return (
        <h3 className="text-lg font-semibold text-gray-200 mb-2 mt-4">
          {children}
        </h3>
      );
    },

    h4({ children }) {
      return (
        <h4 className="text-base font-semibold text-gray-300 mb-2 mt-3">
          {children}
        </h4>
      );
    },

    // Enhanced lists with better spacing
    ul({ children }) {
      return (
        <ul className="list-none space-y-1 my-3 pl-0">
          {children}
        </ul>
      );
    },

    ol({ children }) {
      return (
        <ol className="list-decimal list-inside space-y-1 my-3 text-gray-200">
          {children}
        </ol>
      );
    },

    li({ children, ordered }) {
      if (ordered) {
        return (
          <li className="text-gray-200 leading-relaxed">
            {children}
          </li>
        );
      }
      return (
        <li className="text-gray-200 leading-relaxed flex items-start">
          <span className="text-blue-400 mr-2 mt-1 flex-shrink-0">•</span>
          <span className="flex-1">{children}</span>
        </li>
      );
    },

    // Enhanced blockquotes
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-blue-400 bg-gray-800/30 backdrop-blur-sm pl-4 py-2 my-4 italic text-gray-300 rounded-r-lg">
          {children}
        </blockquote>
      );
    },

    // Enhanced links with external link indicator
    a({ href, children }) {
      const isExternal = href && (href.startsWith('http') || href.startsWith('https'));
      
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : '_self'}
          rel={isExternal ? 'noopener noreferrer' : ''}
          className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50 hover:decoration-blue-300 transition-colors inline-flex items-center gap-1"
        >
          {children}
          {isExternal && <FaExternalLinkAlt className="text-xs opacity-70" />}
        </a>
      );
    },

    // Enhanced paragraphs
    p({ children }) {
      return (
        <p className="text-gray-200 leading-relaxed my-2">
          {children}
        </p>
      );
    },

    // Enhanced strong/bold text
    strong({ children }) {
      return (
        <strong className="font-semibold text-white">
          {children}
        </strong>
      );
    },

    // Enhanced emphasis/italic text
    em({ children }) {
      return (
        <em className="italic text-gray-100">
          {children}
        </em>
      );
    },

    // Horizontal rule
    hr() {
      return (
        <hr className="border-gray-600/30 my-6" />
      );
    },

    // Enhanced images
    img({ src, alt }) {
      return (
        <img
          src={src}
          alt={alt}
          className="max-w-full h-auto rounded-lg border border-gray-600/30 shadow-lg my-4"
        />
      );
    }
  };

  return (
    <div className={`rich-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
        className="prose prose-sm max-w-none prose-invert"
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default RichMessageRenderer;