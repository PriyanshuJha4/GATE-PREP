
'use client';

import { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'default',
});

export default function MermaidDiagram({ chart }) {
  const id = useId().replace(/:/g, '');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        setError(false);

        const { svg } = await mermaid.render(
          `mermaid-${id}`,
          chart
        );

        if (!cancelled) {
          setSvg(svg);
        }
      } catch (err) {
        if (!cancelled) {
          setError(true);
          setSvg('');
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <div className="codeblock">
        <div className="codeblock-bar">
          <span>Mermaid diagram error</span>
        </div>
        <pre>{chart}</pre>
      </div>
    );
  }

  return (
    <div
      className="mermaid-diagram"
      style={{
        width: '100%',
        overflowX: 'auto',
        padding: '16px 0',
      }}
    >
      {svg ? (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <p>Rendering diagram...</p>
      )}
    </div>
  );
}
