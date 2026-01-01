import { Button } from '@react-email/components';
import * as React from 'react';

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  color?: 'red' | 'green' | 'blue' | 'gray';
}

const colorMap = {
  red: '#dc2626',
  green: '#16a34a',
  blue: '#2563eb',
  gray: '#3f3f46',
};

export function EmailButton({ href, children, color = 'blue' }: EmailButtonProps) {
  return (
    <Button
      href={href}
      style={{
        display: 'inline-block',
        padding: '12px 24px',
        backgroundColor: colorMap[color],
        color: '#ffffff',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '16px',
        textAlign: 'center',
      }}
    >
      {children}
    </Button>
  );
}

export default EmailButton;
