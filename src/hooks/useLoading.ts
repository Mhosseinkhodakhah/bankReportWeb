import { useState, useCallback } from "react";

export interface UseLoadingOptions {
  initialLoading?: boolean;
  errorMessage?: string;
  successMessage?: string;
}

export interface UseLoadingReturn {
  loading: boolean;

  setLoading: (loading: boolean) => void;

  execute: <T>(asyncFn: () => Promise<T>) => Promise<T | undefined>;

  executeWithErrorHandling: <T>(
    asyncFn: () => Promise<T>,
    onError?: (error: unknown) => void
  ) => Promise<T | undefined>;

  reset: () => void;
}

export function useLoading(options: UseLoadingOptions = {}): UseLoadingReturn {
  const { initialLoading = false } = options;
  const [loading, setLoading] = useState(initialLoading);

  const execute = useCallback(
    async <T>(asyncFn: () => Promise<T>): Promise<T | undefined> => {
      setLoading(true);
      try {
        const result = await asyncFn();
        return result;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const executeWithErrorHandling = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      onError?: (error: unknown) => void
    ): Promise<T | undefined> => {
      try {
        setLoading(true);
        const result = await asyncFn();
        return result;
      } catch (error) {
        if (onError) {
          onError(error);
        }
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setLoading(false);
  }, []);

  return {
    loading,
    setLoading,
    execute,
    executeWithErrorHandling,
    reset,
  };
}

export function useMultipleLoading(keys: string[]) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  );

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  }, []);

  const execute = useCallback(
    async <T>(
      key: string,
      asyncFn: () => Promise<T>
    ): Promise<T | undefined> => {
      setLoading(key, true);
      try {
        const result = await asyncFn();
        return result;
      } finally {
        setLoading(key, false);
      }
    },
    [setLoading]
  );

  const isAnyLoading = Object.values(loadingStates).some(Boolean);
  const isLoading = (key: string) => loadingStates[key] || false;

  return {
    loadingStates,
    setLoading,
    execute,
    isAnyLoading,
    isLoading,
  };
}
