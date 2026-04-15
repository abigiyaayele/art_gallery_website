import { useState, useEffect, useCallback } from 'react';
import { strapiClient } from '../lib/strapi';

interface UseStrapiFetchOptions {
  populate?: string[];
  filters?: Record<string, any>;
  sort?: string[];
  pagination?: { page?: number; pageSize?: number };
}

/**
 * Hook for fetching Strapi collections
 */
export function useStrapiFetch<T>(
  collectionName: string,
  options?: UseStrapiFetchOptions
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await strapiClient.getCollection<T>(collectionName, options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [collectionName, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * Hook for fetching a single Strapi item
 */
export function useStrapiFetchItem<T>(
  collectionName: string,
  id: string | number | null,
  options?: { populate?: string[] }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(id !== null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (id === null) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await strapiClient.getItem<T>(collectionName, id, options);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collectionName, id, options]);

  return { data, loading, error };
}

/**
 * Hook for creating Strapi items
 */
export function useStrapiCreate<T>(collectionName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (itemData: any): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await strapiClient.createItem<T>(collectionName, itemData);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  return { create, loading, error };
}

/**
 * Hook for updating Strapi items
 */
export function useStrapiUpdate<T>(collectionName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(
    async (id: string | number, itemData: any): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await strapiClient.updateItem<T>(collectionName, id, itemData);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  return { update, loading, error };
}

/**
 * Hook for deleting Strapi items
 */
export function useStrapiDelete(collectionName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const remove = useCallback(
    async (id: string | number): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        await strapiClient.deleteItem(collectionName, id);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  return { remove, loading, error };
}
