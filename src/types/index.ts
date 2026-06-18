export interface StashList {
  id: string;
  uid: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  itemCount: number;
}

export interface StashItem {
  id: string;
  listId: string;
  uid: string;
  name: string;
  url: string;
  image: string;       // scraped or manually provided
  price: string;       // free-form string e.g. "$49.99"
  description: string;
  notes: string;
  tags: string[];
  order: number;
  createdAt: number;
  updatedAt: number;
}
