import { Section, Text, Row, Column } from '@react-email/components';
import * as React from 'react';

interface PriceRowProps {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}

interface PriceBoxProps {
  rows: PriceRowProps[];
  backgroundColor?: string;
}

export function PriceBox({ rows, backgroundColor = '#f0fdf4' }: PriceBoxProps) {
  return (
    <Section
      style={{
        backgroundColor,
        borderRadius: '8px',
        padding: '16px',
        margin: '0 0 24px',
      }}
    >
      {rows.map((row, index) => (
        <Row key={index} style={{ marginBottom: index < rows.length - 1 ? '8px' : '0' }}>
          <Column style={{ width: '60%' }}>
            <Text
              style={{
                fontSize: row.bold ? '16px' : '14px',
                fontWeight: row.bold ? '700' : '400',
                color: row.color || '#18181b',
                margin: '0',
              }}
            >
              {row.label}
            </Text>
          </Column>
          <Column style={{ width: '40%', textAlign: 'right' }}>
            <Text
              style={{
                fontSize: row.bold ? '16px' : '14px',
                fontWeight: row.bold ? '700' : '400',
                color: row.color || '#18181b',
                margin: '0',
              }}
            >
              {row.value}
            </Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}

interface HighlightBoxProps {
  label: string;
  value: string;
  subtext?: string;
  backgroundColor?: string;
  valueColor?: string;
}

export function HighlightBox({
  label,
  value,
  subtext,
  backgroundColor = '#f0fdf4',
  valueColor = '#16a34a',
}: HighlightBoxProps) {
  return (
    <Section
      style={{
        backgroundColor,
        borderRadius: '8px',
        padding: '16px',
        margin: '0 0 24px',
      }}
    >
      <Text style={{ fontSize: '14px', color: '#71717a', margin: '0 0 4px' }}>
        {label}
      </Text>
      <Text
        style={{
          fontSize: '28px',
          fontWeight: '700',
          color: valueColor,
          margin: '0',
        }}
      >
        {value}
      </Text>
      {subtext && (
        <Text style={{ fontSize: '14px', color: '#71717a', margin: '8px 0 0' }}>
          {subtext}
        </Text>
      )}
    </Section>
  );
}

export default PriceBox;
