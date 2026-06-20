-- Tags cho Mana Seed Summer Forest và tileset wilderness top-down 16x16.
-- Chạy: dotnet run --project BE/scripts/SeedSummerForestTilesetTags

DO $seed$
DECLARE
  style_group_id uuid;
  genre_group_id uuid;
  theme_group_id uuid;
  technical_group_id uuid;
  tag_rec record;
BEGIN
  SELECT id INTO style_group_id FROM public.tag_groups WHERE slug = 'style' LIMIT 1;
  SELECT id INTO genre_group_id FROM public.tag_groups WHERE slug = 'genre' LIMIT 1;
  SELECT id INTO theme_group_id FROM public.tag_groups WHERE slug = 'theme' LIMIT 1;
  SELECT id INTO technical_group_id FROM public.tag_groups WHERE slug = 'technical' LIMIT 1;

  IF style_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT * FROM (VALUES ('SNES', 'snes')) AS t(name, slug)
    LOOP
      IF EXISTS (SELECT 1 FROM public.tags WHERE slug = tag_rec.slug) THEN
        UPDATE public.tags SET name = tag_rec.name, group_id = style_group_id WHERE slug = tag_rec.slug;
      ELSE
        INSERT INTO public.tags (id, group_id, name, slug, usage_count, created_at)
        VALUES (gen_random_uuid(), style_group_id, tag_rec.name, tag_rec.slug, 0, NOW());
      END IF;
    END LOOP;
  END IF;

  IF genre_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT * FROM (VALUES ('Adventure', 'adventure')) AS t(name, slug)
    LOOP
      IF EXISTS (SELECT 1 FROM public.tags WHERE slug = tag_rec.slug) THEN
        UPDATE public.tags SET name = tag_rec.name, group_id = genre_group_id WHERE slug = tag_rec.slug;
      ELSE
        INSERT INTO public.tags (id, group_id, name, slug, usage_count, created_at)
        VALUES (gen_random_uuid(), genre_group_id, tag_rec.name, tag_rec.slug, 0, NOW());
      END IF;
    END LOOP;
  END IF;

  IF theme_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT *
      FROM (VALUES
        ('Forest', 'forest'),
        ('Summer', 'summer'),
        ('Waterfall', 'waterfall'),
        ('Mushroom', 'mushroom'),
        ('Wilderness', 'wilderness')
      ) AS t(name, slug)
    LOOP
      IF EXISTS (SELECT 1 FROM public.tags WHERE slug = tag_rec.slug) THEN
        UPDATE public.tags SET name = tag_rec.name, group_id = theme_group_id WHERE slug = tag_rec.slug;
      ELSE
        INSERT INTO public.tags (id, group_id, name, slug, usage_count, created_at)
        VALUES (gen_random_uuid(), theme_group_id, tag_rec.name, tag_rec.slug, 0, NOW());
      END IF;
    END LOOP;
  END IF;

  IF technical_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT *
      FROM (VALUES
        ('16x16', '16x16'),
        ('Auto-Tile', 'auto-tile'),
        ('Animated', 'animated')
      ) AS t(name, slug)
    LOOP
      IF EXISTS (SELECT 1 FROM public.tags WHERE slug = tag_rec.slug) THEN
        UPDATE public.tags SET name = tag_rec.name, group_id = technical_group_id WHERE slug = tag_rec.slug;
      ELSE
        INSERT INTO public.tags (id, group_id, name, slug, usage_count, created_at)
        VALUES (gen_random_uuid(), technical_group_id, tag_rec.name, tag_rec.slug, 0, NOW());
      END IF;
    END LOOP;
  END IF;
END;
$seed$;
