import { renderToString } from 'ink';
import { describe, expect, it } from 'vitest';
import { ProgressView } from '../../src/ui/components/ProgressView';
import { TerminalLayoutContext } from '../../src/ui/layout/TerminalLayoutContext';
import { visibleWidth } from '../../src/ui/text-width';

const layout = {
  terminalColumns: 120,
  terminalRows: 24,
  appWidth: 96,
  contentWidth: 92,
  paddingX: 12,
  contentHeight: 18,
  listViewportRows: 16,
};

function renderProgress(lines: string[], columns = 120): string {
  return renderToString(
    <TerminalLayoutContext value={layout}>
      <ProgressView lines={lines} />
    </TerminalLayoutContext>,
    { columns },
  );
}

describe('progress layout', () => {
  it('keeps rendered rows within terminal width for long clone logs', () => {
    const longPath = `/Users/example/${'component/'.repeat(40)}repo.git`;
    const output = renderProgress([
      `Cloning bare into ${longPath}`,
      'Receiving objects:  42% (120/285), 12.00 MiB | 4.00 MiB/s',
    ]);

    for (const row of output.split('\n')) {
      expect(visibleWidth(row)).toBeLessThanOrEqual(120);
    }
  });
});
