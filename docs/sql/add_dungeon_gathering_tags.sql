-- Tags cho Dungeon Gathering (SnowHex) — dungeon tileset, props, playable hero.
-- Chạy: dotnet run --project BE/scripts/SeedDungeonGatheringTags

DO $seed$
DECLARE
  theme_group_id uuid;
  technical_group_id uuid;
  ui_group_id uuid;
  tag_rec record;
BEGIN
  SELECT id INTO theme_group_id FROM public.tag_groups WHERE slug = 'theme' LIMIT 1;
  SELECT id INTO technical_group_id FROM public.tag_groups WHERE slug = 'technical' LIMIT 1;
  SELECT id INTO ui_group_id FROM public.tag_groups WHERE slug = 'ui-components' LIMIT 1;

  IF theme_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT *
      FROM (VALUES
        ('Dungeon', 'dungeon'),
        ('Castle', 'castle'),
        ('Knight', 'knight'),
        ('Monster', 'monster'),
        ('Door', 'door'),
        ('Potion', 'potion')
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
        ('Icons', 'icons'),
        ('Playable Character', 'playable-character'),
        ('4-Direction', '4-direction'),
        ('Breakable', 'breakable')
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

  IF ui_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT * FROM (VALUES ('Icon', 'icon')) AS t(name, slug)
    LOOP
      IF EXISTS (SELECT 1 FROM public.tags WHERE slug = tag_rec.slug) THEN
        UPDATE public.tags SET name = tag_rec.name, group_id = ui_group_id WHERE slug = tag_rec.slug;
      ELSE
        INSERT INTO public.tags (id, group_id, name, slug, usage_count, created_at)
        VALUES (gen_random_uuid(), ui_group_id, tag_rec.name, tag_rec.slug, 0, NOW());
      END IF;
    END LOOP;
  END IF;
END;
$seed$;
