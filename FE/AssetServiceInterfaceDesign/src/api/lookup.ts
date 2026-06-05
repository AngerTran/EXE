import { apiRequest } from "./client";
import type { CategoryItem, TagGroupItem, TagItem } from "./types/marketplace";

interface CategoryListResponse {
  data: CategoryItem[];
}

interface TagListResponse {
  data: TagItem[];
}

interface TagGroupListResponse {
  data: TagGroupItem[];
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  const res = await apiRequest<CategoryListResponse>("/categories", { auth: false });
  return res.data ?? [];
}

export async function fetchTags(groupId?: string): Promise<TagItem[]> {
  const q = groupId ? `?groupId=${groupId}` : "";
  const res = await apiRequest<TagListResponse>(`/tags${q}`, { auth: false });
  return res.data ?? [];
}

export async function fetchTagGroups(): Promise<TagGroupItem[]> {
  const res = await apiRequest<TagGroupListResponse>("/tag-groups", { auth: false });
  return res.data ?? [];
}
