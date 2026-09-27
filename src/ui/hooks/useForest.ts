import { use } from 'react';
import { AppContext } from '../context/AppContext';

export function useForest() {
  const forest = use(AppContext);
  if (forest === null) {
    throw new Error('useForest must be used within ForestProvider');
  }
  return forest;
}
