import { supabase } from '@/lib/supabase';
import { gridToLetters } from '@/lib/encoding';
import type { BrailleGrid } from '@/types/braille';
import type { Category, Drawing, DrawingStatus, Tag } from '@/types/drawings';

type DrawingRow = {
  id: string;
  owner_id: string;
  title: string;
  author_name: string | null;
  grid: BrailleGrid;
  letters_preview: string | null;
  status: DrawingStatus;
  created_at: string;
  updated_at: string;
  drawing_categories?: Array<{ categories: Category | Category[] | null }>;
  drawing_tags?: Array<{ tags: Tag | Tag[] | null }>;
};

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function mapDrawing(row: DrawingRow): Drawing {
  const categories = (row.drawing_categories ?? [])
    .map((item) => unwrapRelation(item.categories))
    .filter((item): item is Category => Boolean(item));

  const tags = (row.drawing_tags ?? [])
    .map((item) => unwrapRelation(item.tags))
    .filter((item): item is Tag => Boolean(item));

  return {
    id: row.id,
    owner_id: row.owner_id,
    title: row.title,
    author_name: row.author_name,
    grid: row.grid,
    letters_preview: row.letters_preview,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    categories,
    tags,
  };
}

export function serializeGrid(grid: BrailleGrid): BrailleGrid {
  return {
    width: grid.width,
    height: grid.height,
    cells: grid.cells.map((row) =>
      row.map((cell) => ({
        x: cell.x,
        y: cell.y,
        dots: [...(cell.dots ?? [])],
        letter: cell.letter ?? ' ',
        origin: cell.origin,
      }))
    ),
  };
}

const DRAWING_SELECT = `
  id,
  owner_id,
  title,
  author_name,
  grid,
  letters_preview,
  status,
  created_at,
  updated_at,
  drawing_categories (categories (id, slug, name)),
  drawing_tags (tags (id, name))
`;

export async function fetchDrawingById(id: string): Promise<Drawing | null> {
  const { data, error } = await supabase
    .from('drawings')
    .select(DRAWING_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapDrawing(data as DrawingRow);
}

export async function fetchOwnDrawings(ownerId: string): Promise<Drawing[]> {
  const { data, error } = await supabase
    .from('drawings')
    .select(DRAWING_SELECT)
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as DrawingRow[]).map(mapDrawing);
}

export async function fetchPublishedDrawings(): Promise<Drawing[]> {
  const { data, error } = await supabase
    .from('drawings')
    .select(DRAWING_SELECT)
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as DrawingRow[]).map(mapDrawing);
}

export async function fetchAllDrawingsForAdmin(): Promise<Drawing[]> {
  const { data, error } = await supabase
    .from('drawings')
    .select(DRAWING_SELECT)
    .order('updated_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as DrawingRow[]).map(mapDrawing);
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name')
    .order('name');

  if (error || !data) {
    return [];
  }

  return data as Category[];
}

export async function upsertDraftDrawing(params: {
  id?: string | null;
  ownerId: string;
  authorName: string;
  grid: BrailleGrid;
  title?: string;
}): Promise<{ drawing: Drawing | null; error: string | null }> {
  const grid = serializeGrid(params.grid);
  const letters_preview = gridToLetters(grid, '\n');
  const now = new Date().toISOString();

  if (params.id) {
    const { data, error } = await supabase
      .from('drawings')
      .update({
        grid,
        letters_preview,
        author_name: params.authorName,
        status: 'draft',
        updated_at: now,
        ...(params.title ? { title: params.title } : {}),
      })
      .eq('id', params.id)
      .eq('owner_id', params.ownerId)
      .select(DRAWING_SELECT)
      .maybeSingle();

    if (!error && data) {
      return { drawing: mapDrawing(data as DrawingRow), error: null };
    }
  }

  const { data, error } = await supabase
    .from('drawings')
    .insert({
      owner_id: params.ownerId,
      title: params.title || 'Sem título',
      author_name: params.authorName,
      grid,
      letters_preview,
      status: 'draft',
    })
    .select(DRAWING_SELECT)
    .single();

  if (error || !data) {
    return { drawing: null, error: error?.message ?? 'Não foi possível salvar o desenho.' };
  }

  return { drawing: mapDrawing(data as DrawingRow), error: null };
}

async function findOrCreateTag(name: string, userId: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const { data: existing } = await supabase
    .from('tags')
    .select('id, name')
    .ilike('name', trimmed)
    .maybeSingle();

  if (existing?.id) {
    return existing.id as string;
  }

  const { data, error } = await supabase
    .from('tags')
    .insert({ name: trimmed, created_by: userId })
    .select('id')
    .single();

  if (error || !data) {
    const { data: retry } = await supabase
      .from('tags')
      .select('id')
      .ilike('name', trimmed)
      .maybeSingle();
    return retry?.id ?? null;
  }

  return data.id as string;
}

export async function updateDrawingTitle(
  drawingId: string,
  title: string
): Promise<{ error: string | null }> {
  const nextTitle = title.trim() || 'Sem título';
  const { error } = await supabase
    .from('drawings')
    .update({ title: nextTitle, updated_at: new Date().toISOString() })
    .eq('id', drawingId);

  return { error: error?.message ?? null };
}

export async function publishDrawing(params: {
  drawingId: string;
  ownerId: string;
  title: string;
  categoryIds: string[];
  tagNames: string[];
}): Promise<{ error: string | null }> {
  const title = params.title.trim();
  if (!title) {
    return { error: 'Dê um título ao desenho.' };
  }
  if (params.categoryIds.length === 0) {
    return { error: 'Escolha pelo menos uma categoria.' };
  }

  const { error: updateError } = await supabase
    .from('drawings')
    .update({
      title,
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.drawingId)
    .eq('owner_id', params.ownerId);

  if (updateError) {
    return { error: updateError.message };
  }

  await supabase.from('drawing_categories').delete().eq('drawing_id', params.drawingId);
  await supabase.from('drawing_tags').delete().eq('drawing_id', params.drawingId);

  const { error: categoriesError } = await supabase.from('drawing_categories').insert(
    params.categoryIds.map((category_id) => ({
      drawing_id: params.drawingId,
      category_id,
    }))
  );

  if (categoriesError) {
    return { error: categoriesError.message };
  }

  const tagIds: string[] = [];
  for (const name of params.tagNames) {
    const id = await findOrCreateTag(name, params.ownerId);
    if (id) tagIds.push(id);
  }

  if (tagIds.length > 0) {
    const { error: tagsError } = await supabase.from('drawing_tags').insert(
      tagIds.map((tag_id) => ({
        drawing_id: params.drawingId,
        tag_id,
      }))
    );
    if (tagsError) {
      return { error: tagsError.message };
    }
  }

  return { error: null };
}

export async function updateDrawingStatus(
  drawingId: string,
  status: DrawingStatus
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('drawings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', drawingId);

  return { error: error?.message ?? null };
}

export async function deleteDrawing(drawingId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('drawings').delete().eq('id', drawingId);
  return { error: error?.message ?? null };
}
