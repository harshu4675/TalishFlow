import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.resolve(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface BaseDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export class Collection<T extends BaseDocument> {
  private filePath: string;

  constructor(collectionName: string) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  private read(): T[] {
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  private write(data: T[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async find(filter?: Partial<T> | ((item: T) => boolean)): Promise<T[]> {
    const items = this.read();
    if (!filter) return items;

    if (typeof filter === 'function') {
      return items.filter(filter);
    }

    return items.filter((item) => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
  }

  async findOne(filter: Partial<T> | ((item: T) => boolean)): Promise<T | null> {
    const results = await this.find(filter);
    return results.length > 0 ? results[0] : null;
  }

  async insertOne(doc: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const items = this.read();
    const now = new Date().toISOString();
    const newDoc = {
      ...doc,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    } as unknown as T;

    items.push(newDoc);
    this.write(items);
    return newDoc;
  }

  async updateOne(
    filter: Partial<T> | ((item: T) => boolean),
    update: Partial<T> | ((item: T) => T)
  ): Promise<T | null> {
    const items = this.read();
    let index = -1;

    if (typeof filter === 'function') {
      index = items.findIndex(filter);
    } else {
      index = items.findIndex((item) => {
        for (const key in filter) {
          if (item[key] !== filter[key]) return false;
        }
        return true;
      });
    }

    if (index === -1) return null;

    const currentItem = items[index];
    let updatedItem: T;

    if (typeof update === 'function') {
      updatedItem = update(currentItem);
    } else {
      updatedItem = {
        ...currentItem,
        ...update,
        updatedAt: new Date().toISOString(),
      };
    }

    items[index] = updatedItem;
    this.write(items);
    return updatedItem;
  }

  async deleteOne(filter: Partial<T> | ((item: T) => boolean)): Promise<boolean> {
    const items = this.read();
    let index = -1;

    if (typeof filter === 'function') {
      index = items.findIndex(filter);
    } else {
      index = items.findIndex((item) => {
        for (const key in filter) {
          if (item[key] !== filter[key]) return false;
        }
        return true;
      });
    }

    if (index === -1) return false;

    items.splice(index, 1);
    this.write(items);
    return true;
  }

  async deleteMany(filter: Partial<T>): Promise<number> {
    const items = this.read();
    const initialCount = items.length;
    const remaining = items.filter((item) => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });

    this.write(remaining);
    return initialCount - remaining.length;
  }
}
