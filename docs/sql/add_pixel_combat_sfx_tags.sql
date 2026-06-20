-- Tags cho Pixel Combat SFX (Helton Yan) và thư viện âm thanh combat JRPG.
-- Chạy: dotnet run --project BE/scripts/SeedPixelCombatSfxTags

DO $seed$
DECLARE
  genre_group_id uuid;
  style_group_id uuid;
  technical_group_id uuid;
  tag_rec record;
BEGIN
  SELECT id INTO genre_group_id FROM public.tag_groups WHERE slug = 'genre' LIMIT 1;
  SELECT id INTO style_group_id FROM public.tag_groups WHERE slug = 'style' LIMIT 1;
  SELECT id INTO technical_group_id FROM public.tag_groups WHERE slug = 'technical' LIMIT 1;

  IF genre_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT *
      FROM (VALUES
        ('JRPG', 'jrpg'),
        ('Combat', 'combat')
      ) AS t(name, slug)
    LOOP
      IF EXISTS (SELECT 1 FROM public.tags WHERE slug = tag_rec.slug) THEN
        UPDATE public.tags SET name = tag_rec.name, group_id = genre_group_id WHERE slug = tag_rec.slug;
      ELSE
        INSERT INTO public.tags (id, group_id, name, slug, usage_count, created_at)
        VALUES (gen_random_uuid(), genre_group_id, tag_rec.name, tag_rec.slug, 0, NOW());
      END IF;
    END LOOP;
  END IF;

  IF style_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT * FROM (VALUES ('Retro', 'retro')) AS t(name, slug)
    LOOP
      IF EXISTS (SELECT 1 FROM public.tags WHERE slug = tag_rec.slug) THEN
        UPDATE public.tags SET name = tag_rec.name, group_id = style_group_id WHERE slug = tag_rec.slug;
      ELSE
        INSERT INTO public.tags (id, group_id, name, slug, usage_count, created_at)
        VALUES (gen_random_uuid(), style_group_id, tag_rec.name, tag_rec.slug, 0, NOW());
      END IF;
    END LOOP;
  END IF;

  IF technical_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT *
      FROM (VALUES
        ('SFX Pack', 'sfx-pack'),
        ('Sound Effects', 'sound-effects'),
        ('Combat SFX', 'combat-sfx'),
        ('Magic SFX', 'magic-sfx'),
        ('Melee SFX', 'melee-sfx'),
        ('Explosion SFX', 'explosion-sfx'),
        ('UCS', 'ucs')
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
