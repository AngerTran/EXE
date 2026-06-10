-- Tags cho nhạc game: BGM, music pack, chiptune, soundtrack.
-- Chạy: dotnet run --project BE/scripts/SeedAudioMusicTags

DO $seed$
DECLARE
  technical_group_id uuid;
  style_group_id uuid;
  tag_rec record;
BEGIN
  SELECT id INTO technical_group_id FROM public.tag_groups WHERE slug = 'technical' LIMIT 1;
  SELECT id INTO style_group_id FROM public.tag_groups WHERE slug = 'style' LIMIT 1;

  IF technical_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT *
      FROM (VALUES
        ('Music Pack', 'music-pack'),
        ('BGM', 'bgm'),
        ('Soundtrack', 'soundtrack')
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

  IF style_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT * FROM (VALUES ('Chiptune', 'chiptune')) AS t(name, slug)
    LOOP
      IF EXISTS (SELECT 1 FROM public.tags WHERE slug = tag_rec.slug) THEN
        UPDATE public.tags SET name = tag_rec.name, group_id = style_group_id WHERE slug = tag_rec.slug;
      ELSE
        INSERT INTO public.tags (id, group_id, name, slug, usage_count, created_at)
        VALUES (gen_random_uuid(), style_group_id, tag_rec.name, tag_rec.slug, 0, NOW());
      END IF;
    END LOOP;
  END IF;
END;
$seed$;
