import { Children } from 'react';
import { TabsClient } from './TabsClient';

export interface TabsProps {
  /** The tab labels, one per `<Tabs.Tab>` */
  items: React.ReactNode[];
  /** Index of the tab open at first @default 0 */
  defaultIndex?: number;
  children: React.ReactNode;
}

function TabsBase({ items, defaultIndex = 0, children }: TabsProps) {
  // `TabsClient` sets keepMountedMode 'display-none': every panel is in the served HTML, hidden
  // with CSS. Mantine's default mode wraps a closed panel in React's Activity, which a server
  // render leaves out, so the text, code blocks and headings of the other tabs were invisible to
  // crawlers, to Pagefind and to a page read without JavaScript. It also opens the panel a
  // `#anchor` points into. The Collapse of the sidebar has the same setting.
  return (
    <TabsClient items={items} defaultIndex={defaultIndex} panels={Children.toArray(children)} />
  );
}

function Tab({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * Mantine's `Tabs` with Nextra's API:
 *
 * ```mdx
 * <Tabs items={['npm', 'yarn']}>
 *   <Tabs.Tab>npm install</Tabs.Tab>
 *   <Tabs.Tab>yarn add</Tabs.Tab>
 * </Tabs>
 * ```
 *
 * The interactive part is the client component `TabsClient`: this is a server module, and a client
 * component's statics (`Tabs.List`) do not cross the RSC boundary, so the compound object is built here.
 */
export const Tabs = Object.assign(TabsBase, { Tab });
