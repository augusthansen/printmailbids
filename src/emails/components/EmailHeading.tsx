import { Heading } from '@react-email/components';
import * as React from 'react';

interface EmailHeadingProps {
  children: React.ReactNode;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function EmailHeading({ children, color = '#18181b', align = 'left' }: EmailHeadingProps) {
  return (
    <Heading
      style={{
        fontSize: '24px',
        fontWeight: '600',
        color,
        margin: '0 0 16px',
        textAlign: align,
      }}
    >
      {children}
    </Heading>
  );
}

export default EmailHeading;
