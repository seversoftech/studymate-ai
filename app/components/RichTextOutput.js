'use client';

function renderInline(text, keyPrefix) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`${keyPrefix}-code-${index}`}>{part.slice(1, -1)}</code>;
    }

    if (
      (part.startsWith('**') && part.endsWith('**')) ||
      (part.startsWith('__') && part.endsWith('__'))
    ) {
      return <strong key={`${keyPrefix}-strong-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return <span key={`${keyPrefix}-span-${index}`}>{part}</span>;
  });
}

function parseBlocks(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: 'paragraph', lines: [...paragraph] });
    paragraph = [];
  };

  const flushList = () => {
    if (!list || !list.items.length) return;
    blocks.push(list);
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      continue;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      if (!list || list.type !== 'unordered-list') {
        flushList();
        list = { type: 'unordered-list', items: [] };
      }
      list.items.push(bulletMatch[1]);
      continue;
    }

    const orderedMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      if (!list || list.type !== 'ordered-list') {
        flushList();
        list = { type: 'ordered-list', items: [] };
      }
      list.items.push(orderedMatch[2]);
      continue;
    }

    const quoteMatch = line.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'quote', text: quoteMatch[1] });
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

export default function RichTextOutput({ text, className = '' }) {
  const blocks = parseBlocks(text || '');

  if (!blocks.length) {
    return <div className={`rich-output ${className}`.trim()}>{text}</div>;
  }

  return (
    <div className={`rich-output ${className}`.trim()}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          if (block.level === 1) {
            return <h1 key={`heading-${index}`}>{renderInline(block.text, `heading-${index}`)}</h1>;
          }

          if (block.level === 2) {
            return <h2 key={`heading-${index}`}>{renderInline(block.text, `heading-${index}`)}</h2>;
          }

          return <h3 key={`heading-${index}`}>{renderInline(block.text, `heading-${index}`)}</h3>;
        }

        if (block.type === 'unordered-list') {
          return (
            <ul key={`ul-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`ul-${index}-${itemIndex}`}>{renderInline(item, `ul-${index}-${itemIndex}`)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ordered-list') {
          return (
            <ol key={`ol-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`ol-${index}-${itemIndex}`}>{renderInline(item, `ol-${index}-${itemIndex}`)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === 'quote') {
          return <blockquote key={`quote-${index}`}>{renderInline(block.text, `quote-${index}`)}</blockquote>;
        }

        return (
          <p key={`paragraph-${index}`}>
            {renderInline(block.lines.join(' '), `paragraph-${index}`)}
          </p>
        );
      })}
    </div>
  );
}
