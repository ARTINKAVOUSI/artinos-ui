'use client';
import { useCallback, useSyncExternalStore } from 'react';
import type { MetaBlockWorkspace } from './workspace';
export function useWorkspaceRevision(workspace: MetaBlockWorkspace) {
  const subscribe = useCallback((listener: () => void) => workspace.on('*', () => listener()), [workspace]);
  const get = useCallback(() => workspace.revision, [workspace]);
  return useSyncExternalStore(subscribe, get, get);
}
