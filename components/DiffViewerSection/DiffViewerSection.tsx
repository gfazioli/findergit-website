'use client';

import {
  Box,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';

interface DiffLine {
  lineNum: number | [number, number];
  type: 'context' | 'addition' | 'deletion';
  content: string;
}

const diffLines: DiffLine[] = [
  { lineNum: [14, 14], type: 'context', content: 'struct HeaderView: View {' },
  { lineNum: [15, 0], type: 'deletion', content: '    let title = "My App"' },
  { lineNum: [0, 15], type: 'addition', content: '    @State var title: String' },
  { lineNum: [0, 16], type: 'addition', content: '    @State var isExpanded = false' },
  { lineNum: [17, 17], type: 'context', content: '' },
  { lineNum: [18, 18], type: 'context', content: '    var body: some View {' },
  { lineNum: [19, 0], type: 'deletion', content: '        Text(title)' },
  { lineNum: [0, 19], type: 'addition', content: '        VStack {' },
  { lineNum: [0, 20], type: 'addition', content: '            Text(title).font(.headline)' },
  { lineNum: [0, 21], type: 'addition', content: '            if isExpanded {' },
  { lineNum: [0, 22], type: 'addition', content: '                DetailView()' },
  { lineNum: [0, 23], type: 'addition', content: '            }' },
  { lineNum: [0, 24], type: 'addition', content: '        }' },
  { lineNum: [25, 25], type: 'context', content: '    }' },
  { lineNum: [26, 26], type: 'context', content: '}' },
];

function getLineColor(type: DiffLine['type']) {
  switch (type) {
    case 'addition':
      return { bg: 'rgba(40, 167, 69, 0.12)', color: '#28a745', prefix: '+' };
    case 'deletion':
      return { bg: 'rgba(215, 58, 73, 0.12)', color: '#d73a49', prefix: '\u2013' };
    default:
      return { bg: 'transparent', color: 'var(--mantine-color-dark-1)', prefix: ' ' };
  }
}

function getLineNumber(lineNum: DiffLine['lineNum'], type: DiffLine['type']) {
  if (Array.isArray(lineNum)) {
    const [old, new_] = lineNum;
    return {
      left: type === 'addition' ? '' : String(old),
      right: type === 'deletion' ? '' : String(new_),
    };
  }
  return { left: String(lineNum), right: String(lineNum) };
}

export function DiffViewerSection() {
  return (
    <Box
      py={80}
      style={{
        backgroundColor: 'var(--mantine-color-dark-8)',
      }}
    >
      <Container size="lg">
        <Stack align="center" gap="md" mb={48}>
          <Text
            size="sm"
            fw={700}
            tt="uppercase"
            style={{ letterSpacing: 3 }}
            c="orange"
          >
            Diff Viewer
          </Text>
          <Title
            order={2}
            ta="center"
            fz={{ base: 32, sm: 42 }}
            fw={900}
            c="white"
          >
            See every change at a glance
          </Title>
        </Stack>

        <Paper
          radius="lg"
          bg="var(--mantine-color-dark-7)"
          style={{ overflow: 'hidden', border: '1px solid var(--mantine-color-dark-5)' }}
          maw={800}
          mx="auto"
        >
          {/* File header */}
          <Group
            justify="space-between"
            px="lg"
            py="sm"
            bg="var(--mantine-color-dark-6)"
            style={{ borderBottom: '1px solid var(--mantine-color-dark-5)' }}
          >
            <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
              src/components/Header.swift
            </Text>
            <Group gap="xs">
              <Text size="sm" c="green" fw={600}>+12</Text>
              <Text size="sm" c="red" fw={600}>-4</Text>
            </Group>
          </Group>

          {/* Diff lines */}
          <Box style={{ fontFamily: 'monospace', fontSize: 13 }}>
            {diffLines.map((line, idx) => {
              const style = getLineColor(line.type);
              const nums = getLineNumber(line.lineNum, line.type);
              return (
                <Group
                  key={idx}
                  gap={0}
                  wrap="nowrap"
                  style={{ backgroundColor: style.bg }}
                >
                  <Text
                    size="xs"
                    c="dark.3"
                    ta="right"
                    w={40}
                    px={8}
                    py={2}
                    style={{ flexShrink: 0, userSelect: 'none' }}
                  >
                    {nums.left}
                  </Text>
                  <Text
                    size="xs"
                    c="dark.3"
                    ta="right"
                    w={40}
                    px={8}
                    py={2}
                    style={{
                      flexShrink: 0,
                      userSelect: 'none',
                      borderRight: '1px solid var(--mantine-color-dark-5)',
                    }}
                  >
                    {nums.right}
                  </Text>
                  <Text
                    size="xs"
                    c={style.color}
                    px={12}
                    py={2}
                    style={{ whiteSpace: 'pre', flex: 1, overflow: 'hidden' }}
                  >
                    {style.prefix} {line.content}
                  </Text>
                </Group>
              );
            })}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
