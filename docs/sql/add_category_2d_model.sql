-- Thêm danh mục Mô hình 2D (sau Mô hình 3D).
-- Chạy: dotnet run --project BE/scripts/SeedCategory2DModel

DO $seed$
DECLARE
  three_d_order smallint := 0;
BEGIN
  SELECT sort_order
  INTO three_d_order
  FROM public.categories
  WHERE slug = '3d-model'
  LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = '2d-model') THEN
    UPDATE public.categories
    SET sort_order = sort_order + 1
    WHERE sort_order > three_d_order;

    INSERT INTO public.categories (id, slug, name, description, sort_order, is_active, created_at)
    VALUES (
      gen_random_uuid(),
      '2d-model',
      'Mô hình 2D',
      'Sprite, tileset, nhân vật và môi trường 2D',
      three_d_order + 1,
      true,
      NOW()
    );
  ELSE
    UPDATE public.categories
    SET name = 'Mô hình 2D',
        description = 'Sprite, tileset, nhân vật và môi trường 2D',
        is_active = true
    WHERE slug = '2d-model';
  END IF;
END;
$seed$;
