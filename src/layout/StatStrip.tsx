import type { CSSProperties, ReactNode } from 'react';
import { RollingText } from '../core/RollingValue';
import { cx } from '../core/utils';

/* ARTINOS StatStrip — the few figures that say how a thing is right now, side by side at the top of
   a panel: each large and thin with a small name under it, hairlines between. Its digits roll. For
   one figure with a change and a trend, use Stat. */

export interface StatStripItem {
  /** What the figure is: "Visits". */
  label: ReactNode;
  /** The figure, already formatted ("1.23") or a number. */
  value: string | number;
  /** A small unit after the figure: "%", "ms". */
  unit?: string;
}

export interface StatStripProps {
  /** Two to four figures; more stop being a glance. */
  items: readonly StatStripItem[];
  className?: string;
  style?: CSSProperties;
  id?: string;
}

export function StatStrip({ items, className, style, id }: StatStripProps) {
  return (
    <dl id={id} className={cx('ar-stat-strip', className)} style={{ '--_n': items.length, ...style } as CSSProperties}>
      {items.map((item, i) => {
        const text = String(item.value);
        return (
          <div key={i} className="ar-stat-strip__item">
            <dt className="ar-stat-strip__label">{item.label}</dt>
            <dd className="ar-stat-strip__value">
              <RollingText text={text} base={text.split('.')[1]?.length ?? 0} />
              {item.unit ? <small>{item.unit}</small> : null}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
