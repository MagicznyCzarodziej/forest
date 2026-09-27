import type { RepositoryCatalogEntry } from '../../../domain/types';
import type { ListRow } from '../../components/SelectableList/SelectableList';

export function repositoryToListRow(repository: RepositoryCatalogEntry): ListRow {
  return {
    id: repository.name,
    primary: repository.name,
    suffixRole: repository.clonedLocally ? 'cloned' : 'not-cloned',
    hintRole: repository.structure === 'legacy' ? 'legacy' : undefined,
  };
}
