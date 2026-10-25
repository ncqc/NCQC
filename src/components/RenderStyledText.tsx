'use client';
import React from 'react';
import { parseStyledText } from '@/utils/styledText';

interface RenderStyledTextProps {
  text: string | undefined | null;
  className?: string;
  style?: React.CSSProperties;
  defaultTag?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div';
}

export default function RenderStyledText({
  text,
  className,
  style,
  defaultTag = 'span'
}: RenderStyledTextProps) {
  if (!text) return null;

  const parsed = parseStyledText(text);

  const combinedStyle: React.CSSProperties = {
    ...style,
    ...(parsed.font ? { fontFamily: `'${parsed.font}', sans-serif` } : {}),
    ...(parsed.color ? { color: parsed.color } : {}),
    ...(parsed.bold ? { fontWeight: 'bold' } : {}),
    ...(parsed.align ? { textAlign: parsed.align, display: 'block', width: '100%' } : {})
  };

  const Tag = defaultTag;

  return (
    <Tag className={className} style={combinedStyle}>
      {parsed.text}
    </Tag>
  );
}
