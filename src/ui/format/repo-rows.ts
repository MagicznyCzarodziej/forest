import type { RepoCatalogEntry } from '../../domain/types.js';
import type { ListRow } from '../components/SelectableList.js';

export function repoToListRow(repo: RepoCatalogEntry): ListRow {
  return {
    id: repo.name,
    primary: repo.name,
    suffixRole: repo.clonedLocally ? 'cloned' : 'not-cloned',
    hintRole: repo.structure === 'legacy' ? 'legacy' : undefined,
  };
}
