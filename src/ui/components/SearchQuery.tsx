import { Text } from "ink";
import { ui } from "../theme/ui-tokens.js";

export function SearchQuery({ query }: { query: string }) {
  const display = query.length > 0 ? query : " ";
  return (
    <Text bold color={ui.filter}>
      {display}
    </Text>
  );
}
