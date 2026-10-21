'use client';

import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import MermaidDiagram from './MermaidDiagram';

function getRange(node) {
  const position = node?.position;
  if (!position) return {};
  return {
    'data-source-start': position.start?.offset,
    'data-source-end': position.end?.offset,
  };
}

function makeSourceComponent(tag, onSourceNavigate) {
  const Tag = tag;
  return function SourceMappedElement({ node, children, ...props }) {
    const range = getRange(node);
    const start = range['data-source-start'];
    const end = range['data-source-end'];
    return (
      <Tag
        {...props}
        {...range}
        className={`${props.className || ''} source-mapped-element`.trim()}
        title={start == null ? props.title : 'Click to navigate to this element in the source'}
        onClick={(event) => {
          if (typeof onSourceNavigate === 'function' && start != null) {
            event.preventDefault?.();
            event.stopPropagation();
            onSourceNavigate(start, end);
          }
          props.onClick?.(event);
        }}
      >
        {children}
      </Tag>
    );
  };
}

function CodeBlock({ node, children, onSourceNavigate, ...props }) {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);
  const className = children?.props?.className || '';
  const lang = (className.match(/language-([\w-]+)/) || [])[1];
  const code = String(children?.props?.children ?? '').replace(/\n$/, '');
  const range = getRange(node);

  if (lang === 'mermaid') {
    return (
      <div
        className="source-mapped-element source-mapped-diagram"
        {...range}
        title="Click to navigate to the Mermaid source block"
        onClick={(event) => {
          event.stopPropagation();
          if (typeof onSourceNavigate === 'function' && range['data-source-start'] != null) {
            onSourceNavigate(range['data-source-start'], range['data-source-end']);
          }
        }}
      >
        <MermaidDiagram chart={code} />
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ref.current?.innerText || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div
      className="codeblock source-mapped-element"
      {...range}
      title="Click to navigate to this code block's source"
      onClick={(event) => {
        event.stopPropagation();
        if (typeof onSourceNavigate === 'function' && range['data-source-start'] != null) {
          onSourceNavigate(range['data-source-start'], range['data-source-end']);
        }
      }}
    >
      <div className="codeblock-bar">
        <span>{lang || 'code'}</span>
        <button type="button" onClick={(event) => { event.stopPropagation(); copy(); }}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre ref={ref} {...props}>{children}</pre>
    </div>
  );
}

export default function MarkdownRenderer({ content, className = '', onSourceNavigate }) {
  const components = {
    pre: (props) => <CodeBlock {...props} onSourceNavigate={onSourceNavigate} />,
    h1: makeSourceComponent('h1', onSourceNavigate),
    h2: makeSourceComponent('h2', onSourceNavigate),
    h3: makeSourceComponent('h3', onSourceNavigate),
    h4: makeSourceComponent('h4', onSourceNavigate),
    p: makeSourceComponent('p', onSourceNavigate),
    li: makeSourceComponent('li', onSourceNavigate),
    blockquote: makeSourceComponent('blockquote', onSourceNavigate),
    table: ({ node, children, ...props }) => {
      const range = getRange(node);
      return <div className="table-wrap source-mapped-element" {...range} title="Click to navigate to this table's Markdown source" onClick={(event) => {
        event.stopPropagation();
        if (typeof onSourceNavigate === 'function' && range['data-source-start'] != null) onSourceNavigate(range['data-source-start'], range['data-source-end']);
      }}><table {...props}>{children}</table></div>;
    },
    a: ({ node, href = '', children, ...props }) => {
      const external = /^https?:\/\//.test(href);
      const range = getRange(node);
      return <a href={href} {...props} {...range} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        onClick={(event) => {
          if (typeof onSourceNavigate === 'function' && range['data-source-start'] != null) {
            event.preventDefault(); event.stopPropagation(); onSourceNavigate(range['data-source-start'], range['data-source-end']);
          }
        }}>{children}</a>;
    },
  };

  return (
    <div className={`prose ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false }], [rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
