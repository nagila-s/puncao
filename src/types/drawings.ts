import type { BrailleGrid } from '@/types/braille';

export type DrawingStatus = 'draft' | 'pending' | 'published' | 'rejected';

export type Category = {
  id: string;
  slug: string;
  name: string;
};

export type Tag = {
  id: string;
  name: string;
};

export type Drawing = {
  id: string;
  owner_id: string;
  title: string;
  author_name: string | null;
  grid: BrailleGrid;
  letters_preview: string | null;
  status: DrawingStatus;
  created_at: string;
  updated_at: string;
  categories?: Category[];
  tags?: Tag[];
};

export const STATUS_LABELS: Record<DrawingStatus, string> = {
  draft: 'Não publicado',
  pending: 'Aguardando aprovação',
  published: 'Publicado',
  rejected: 'Rejeitado',
};
