-- Thêm nhóm tag Phương tiện: car, vehicle, transportation, oopi.
-- Chạy: dotnet run --project BE/scripts/SeedVehicleTags

DO $seed$
DECLARE
  vehicle_group_id uuid;
  tag_rec record;
BEGIN
  SELECT id INTO vehicle_group_id
  FROM public.tag_groups
  WHERE slug = 'vehicles'
  LIMIT 1;

  IF vehicle_group_id IS NULL THEN
    INSERT INTO public.tag_groups (id, slug, label, sort_order)
    VALUES (gen_random_uuid(), 'vehicles', 'Phương tiện', 7)
    RETURNING id INTO vehicle_group_id;
  ELSE
    UPDATE public.tag_groups
    SET label = 'Phương tiện'
    WHERE id = vehicle_group_id;
  END IF;

  FOR tag_rec IN
    SELECT *
    FROM (VALUES
      ('Car', 'car'),
      ('Vehicle', 'vehicle'),
      ('Transportation', 'transportation'),
      ('Oopi', 'oopi')
    ) AS t(name, slug)
  LOOP
    IF EXISTS (SELECT 1 FROM public.tags WHERE slug = tag_rec.slug) THEN
      UPDATE public.tags
      SET name = tag_rec.name,
          group_id = vehicle_group_id
      WHERE slug = tag_rec.slug;
    ELSE
      INSERT INTO public.tags (id, group_id, name, slug, usage_count, created_at)
      VALUES (gen_random_uuid(), vehicle_group_id, tag_rec.name, tag_rec.slug, 0, NOW());
    END IF;
  END LOOP;
END;
$seed$;
