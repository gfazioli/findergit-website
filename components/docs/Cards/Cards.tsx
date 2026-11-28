import { IconArrowRight } from '@tabler/icons-react';
import { Card as MantineCard, Group, SimpleGrid, Text } from '@mantine/core';
import { Link } from '@/components/Link/Link';
import classes from './Cards.module.css';

export interface CardsProps {
  /** Number of columns from the `sm` breakpoint up @default 3 */
  num?: number;
  children: React.ReactNode;
}

export interface CardProps {
  title: React.ReactNode;
  href: string;
  icon?: React.ReactNode;
  /** Adds an arrow after the title */
  arrow?: boolean;
  target?: React.HTMLAttributeAnchorTarget;
  children?: React.ReactNode;
}

function CardsGrid({ num = 3, children }: CardsProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: Math.min(num, 2), md: num }} spacing="md" my="md">
      {children}
    </SimpleGrid>
  );
}

function Card({ title, href, icon, arrow, target, children }: CardProps) {
  const external = /^https?:/.test(href) || target === '_blank';

  return (
    <MantineCard
      component={Link}
      href={href}
      target={target}
      rel={external ? 'noopener noreferrer' : undefined}
      withBorder
      radius="md"
      padding="md"
      className={classes.card}
    >
      {children && <div className={classes.media}>{children}</div>}
      <Group gap="xs" wrap="nowrap" className={classes.title}>
        {icon && <span className={classes.icon}>{icon}</span>}
        <Text fw={600} size="sm" inherit={false} component="span">
          {title}
        </Text>
        {arrow && <IconArrowRight size={16} className={classes.arrow} />}
      </Group>
    </MantineCard>
  );
}

/**
 * Link cards on Mantine's `SimpleGrid` and `Card`, with Nextra's API:
 * `<Cards num={2}><Cards.Card arrow icon={<IconBrandGithub />} title="…" href="…" /></Cards>`.
 */
export const Cards = Object.assign(CardsGrid, { Card });
