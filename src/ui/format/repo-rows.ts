import type { RepoCatalogEntry } from '../../domain/types';
import type { ListRow } from '../components/SelectableList';

export function repoToListRow(repo: RepoCatalogEntry): ListRow {
  return {
    id: repo.name,
    primary: repo.name,
    suffixRole: repo.clonedLocally ? 'cloned' : 'not-cloned',
    hintRole: repo.structure === 'legacy' ? 'legacy' : undefined,
  };
}
