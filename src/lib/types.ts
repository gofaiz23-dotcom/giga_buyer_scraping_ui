// Shared types that mirror the FastAPI backend response shapes.
// Only describe the fields the UI actually reads.

export type JobStatus = "idle" | "running" | "completed" | "failed" | string;

// ---------- /api/products/start ----------
export interface StartResponse {
  ok: boolean;
  message: string;
  job: string;
}

// ---------- /api/products/status ----------
export interface ProductsSummary {
  parent_category_count: number;
  category_count: number;
  subcategory_count: number;
}

export interface ParentStatus {
  name: string;
  status: JobStatus;
  started_at?: string | null;
  finished_at?: string | null;
}

export interface CategoryStatus {
  name: string;
  status: JobStatus;
  started_at?: string | null;
  finished_at?: string | null;
  product_count: number;
  subcategory_count: number;
}

export interface SubcategoryStatus {
  name: string;
  status: JobStatus;
  started_at?: string | null;
  finished_at?: string | null;
  product_count: number;
  variant_count?: number;
  category?: string;
}

export interface ProductsTopLevel {
  status?: JobStatus;
  started_at?: string | null;
  finished_at?: string | null;
  [key: string]: unknown;
}

export interface StatusResponse {
  products: ProductsTopLevel;
  assign_parent_categories: string[];
  assign_categories: string[];
  summary: ProductsSummary;
  parent_statuses: ParentStatus[];
  category_statuses: CategoryStatus[];
  subcategory_statuses: SubcategoryStatus[];
}

// ---------- /api/products/s3 ----------
export interface BucketFile {
  name: string;
  url: string;
}

export interface BucketSubcategory {
  name: string;
  url: string;
  files: BucketFile[];
  product_count_xlsx?: number;
}

export interface BucketCategory {
  name: string;
  parent_category: string | null;
  subcategory_count: number;
  url: string;
  files: BucketFile[];
  subcategories: BucketSubcategory[];
  product_count_xlsx?: number;
}

export interface BucketCounts {
  parent_category_folders: number;
  category_folders: number;
  subcategory_folders: number;
  total_folders: number;
  total_files: number;
  total_products_xlsx?: number;
}

export interface BucketParentAssign {
  url: string;
  files: BucketFile[];
}

export interface BucketResponse {
  bucket: string;
  base_prefix: string;
  counts: BucketCounts;
  tree: {
    parentassign: BucketParentAssign;
    categories: BucketCategory[];
  };
}
