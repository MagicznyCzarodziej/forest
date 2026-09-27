import { Text } from "ink";
import { ui } from "../theme/ui-tokens.js";

export function SearchQuery({ query, hint = "" }: { query: string; hint?: string }) {
  const display = query.length > 0 ? query : " ";
  return (
    <Text bold>
      <Text color={ui.filter}>{display}</Text>
      {hint.length > 0 ? <Text color={ui.muted}>{hint}</Text> : null}
    </Text>
  );
}
