-- Thêm nhóm tag Thành phần UI và các tag: input, prompt, button, gamepad, control, interface.
-- Chạy: dotnet run --project BE/scripts/SeedUIComponentTags

DO $seed$
DECLARE
  ui_group_id uuid;
  tag_rec record;
BEGIN
  SELECT id INTO ui_group_id
  FROM public.tag_groups
  WHERE slug = 'ui-components'
  LIMIT 1;

  IF ui_group_id IS NULL THEN
    INSERT INTO public.tag_groups (id, slug, label, sort_order)
    VALUES (gen_random_uuid(), 'ui-components', 'Thành phần UI', 6)
    RETURNING id INTO ui_group_id;
  ELSE
    UPDATE public.tag_groups
    SET label = 'Thành phần UI'
    WHERE id = ui_group_id;
  END IF;

  FOR tag_rec IN
    SELECT *
    FROM (VALUES
      ('Input', 'input'),
      ('Prompt', 'prompt'),
      ('Button', 'button'),
      ('Gamepad', 'gamepad'),
      ('Control', 'control'),
      ('Interface', 'interface')
    ) AS t(name, slug)
  LOOP
    IF EXISTS (SELECT 1 FROM public.tags WHERE slug = tag_rec.slug) THEN
      UPDATE public.tags
      SET name = tag_rec.name,
          group_id = ui_group_id
      WHERE slug = tag_rec.slug;
    ELSE
      INSERT INTO public.tags (id, group_id, name, slug, usage_count, created_at)
      VALUES (gen_random_uuid(), ui_group_id, tag_rec.name, tag_rec.slug, 0, NOW());
    END IF;
  END LOOP;
END;
$seed$;
