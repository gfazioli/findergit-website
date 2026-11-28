import type { MDXComponents } from 'mdx/types';
import NextImage, { type StaticImageData } from 'next/image';
import {
  Anchor,
  Code,
  Divider,
  Image,
  List,
  ListItem,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Title,
} from '@mantine/core';
import { Link } from '@/components/Link/Link';
import { GitHubAlert } from '../Callout/GitHubAlert';
import { CodeBlock } from '../CodeBlock/CodeBlock';
import classes from './MdxElements.module.css';

type HeadingOrder = 1 | 2 | 3 | 4 | 5 | 6;

/** A heading whose text links to itself, as on mantine.dev. Its `id` comes from `rehype-slug`. */
function heading(order: HeadingOrder) {
  return function MdxTitle({ id, children }: React.ComponentPropsWithoutRef<'h1'>) {
    return (
      <Title order={order} id={id} className={classes.title} data-order={order}>
        {id ? (
          <a href={`#${id}`} className={classes.titleLink}>
            {children}
          </a>
        ) : (
          children
        )}
      </Title>
    );
  };
}

function MdxLink({ href = '', children, ...others }: React.ComponentPropsWithoutRef<'a'>) {
  if (/^(https?:)?\/\//.test(href) || href.startsWith('mailto:')) {
    return (
      <Anchor href={href} target="_blank" rel="noopener noreferrer" {...others}>
        {children}
      </Anchor>
    );
  }
  return (
    <Anchor component={Link} href={href} {...others}>
      {children}
    </Anchor>
  );
}

/** Inline code. Nextra's `` `code{:ts}` `` language hint is dropped: the text alone is shown. */
function MdxCode({ children }: React.ComponentPropsWithoutRef<'code'>) {
  const text =
    typeof children === 'string' ? children.replace(/\{:[\w-]+\}$/, '') : (children as string);
  return <Code className={classes.code}>{text}</Code>;
}

/**
 * The HTML that MDX produces, rendered with Mantine components: headings with `Title`, links with
 * `Anchor`, lists with `List`, tables with `Table`, code with `CodeHighlight`, quotes with
 * `Blockquote` (or a `Callout` for GitHub's `> [!NOTE]` alerts).
 */
export const mdxElements: MDXComponents = {
  h1: heading(1),
  h2: heading(2),
  h3: heading(3),
  h4: heading(4),
  h5: heading(5),
  h6: heading(6),
  p: (props) => <Text component="p" className={classes.paragraph} {...props} />,
  a: MdxLink,
  ul: ({ children }) => (
    <List className={classes.list} spacing={4} withPadding>
      {children}
    </List>
  ),
  ol: ({ children, start }) => (
    <List type="ordered" start={start} className={classes.list} spacing={4} withPadding>
      {children}
    </List>
  ),
  li: ({ children, className }) => <ListItem className={className}>{children}</ListItem>,
  code: MdxCode,
  pre: CodeBlock,
  blockquote: GitHubAlert,
  hr: () => <Divider my="xl" />,
  // A relative image (`![](./photo.png)`) arrives as an imported file (`remark-static-images`):
  // `next/image` takes its size from it, and `h="auto"` keeps the ratio at the column's width
  // (Mantine's `Image` is `object-fit: cover`, which cropped it to the height attribute).
  img: ({ src, alt }) =>
    typeof src === 'object' && src !== null ? (
      <Image
        component={NextImage}
        src={src as StaticImageData}
        alt={alt ?? ''}
        radius="md"
        my="md"
        h="auto"
      />
    ) : (
      <Image src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} radius="md" my="md" />
    ),
  table: (props) => (
    <TableScrollContainer minWidth={500} my="md">
      <Table striped highlightOnHover withTableBorder withColumnBorders {...props} />
    </TableScrollContainer>
  ),
  thead: (props) => <TableThead {...props} />,
  tbody: (props) => <TableTbody {...props} />,
  tr: (props) => <TableTr {...props} />,
  th: (props) => <TableTh {...props} />,
  td: (props) => <TableTd {...props} />,
};
