import axios, { AxiosInstance } from 'axios';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

class StrapiClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${STRAPI_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token if available
    const token = import.meta.env.VITE_STRAPI_TOKEN;
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  /**
   * Fetch a collection with optional filters, sorting, and pagination
   */
  async getCollection<T>(
    collectionName: string,
    options?: {
      filters?: Record<string, any>;
      sort?: string[];
      pagination?: { page?: number; pageSize?: number };
      populate?: string[];
    }
  ): Promise<T[]> {
    try {
      const params = new URLSearchParams();

      // Add populate for relations and media
      if (options?.populate?.length) {
        options.populate.forEach((field) => {
          params.append('populate', field);
        });
      }

      // Add pagination
      if (options?.pagination) {
        if (options.pagination.page)
          params.append('pagination[page]', String(options.pagination.page));
        if (options.pagination.pageSize)
          params.append('pagination[pageSize]', String(options.pagination.pageSize));
      }

      // Add sorting
      if (options?.sort?.length) {
        options.sort.forEach((sort) => {
          params.append('sort', sort);
        });
      }

      // Add filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          params.append(`filters[${key}][$eq]`, String(value));
        });
      }

      const response = await this.api.get(`/${collectionName}?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Fetch a single collection item by ID
   */
  async getItem<T>(
    collectionName: string,
    id: string | number,
    options?: {
      populate?: string[];
    }
  ): Promise<T> {
    try {
      const params = new URLSearchParams();

      if (options?.populate?.length) {
        options.populate.forEach((field) => {
          params.append('populate', field);
        });
      }

      const response = await this.api.get(`/${collectionName}/${id}?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching ${collectionName}/${id}:`, error);
      throw error;
    }
  }

  /**
   * Get media URL - handles both relative and absolute URLs
   */
  getMediaUrl(path?: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${STRAPI_URL}${path}`;
  }

  /**
   * Create a new item
   */
  async createItem<T>(collectionName: string, data: any): Promise<T> {
    try {
      const response = await this.api.post(`/${collectionName}`, { data });
      return response.data.data;
    } catch (error) {
      console.error(`Error creating ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Update an item
   */
  async updateItem<T>(
    collectionName: string,
    id: string | number,
    data: any
  ): Promise<T> {
    try {
      const response = await this.api.put(`/${collectionName}/${id}`, { data });
      return response.data.data;
    } catch (error) {
      console.error(`Error updating ${collectionName}/${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(collectionName: string, id: string | number): Promise<void> {
    try {
      await this.api.delete(`/${collectionName}/${id}`);
    } catch (error) {
      console.error(`Error deleting ${collectionName}/${id}:`, error);
      throw error;
    }
  }
}

export const strapiClient = new StrapiClient();
