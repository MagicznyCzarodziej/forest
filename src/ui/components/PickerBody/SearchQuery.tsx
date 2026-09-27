import { Text } from 'ink';
import { ui } from '../../theme/uiTokens';

interface SearchQueryProps {
  query: string;
  hint?: string;
}

export function SearchQuery({ query, hint = '' }: SearchQueryProps) {
  // Keep empty line rendered if empty query
  const display = query.length > 0 ? query : ' ';

  return (
    <Text bold>
      <Text color={ui.filter}>{display}</Text>
      {hint.length > 0 ? <Text color={ui.muted}>{hint}</Text> : null}
    </Text>
  );
}
