-- Nhóm tag Thiên nhiên & vật chất: đất đá, cây cỏ, nước, không khí, lửa, kim loại, động vật…
-- Chạy: dotnet run --project BE/scripts/SeedNaturalMaterialsTags

DO $seed$
DECLARE
  nature_group_id uuid;
  tag_rec record;
BEGIN
  SELECT id INTO nature_group_id
  FROM public.tag_groups
  WHERE slug = 'natural-materials'
  LIMIT 1;

  IF nature_group_id IS NULL THEN
    INSERT INTO public.tag_groups (id, slug, label, sort_order)
    VALUES (gen_random_uuid(), 'natural-materials', 'Thiên nhiên & vật chất', 8)
    RETURNING id INTO nature_group_id;
  ELSE
    UPDATE public.tag_groups
    SET label = 'Thiên nhiên & vật chất'
    WHERE id = nature_group_id;
  END IF;

  FOR tag_rec IN
    SELECT *
    FROM (VALUES
      -- Nguyên tố & địa chất
      ('Earth', 'earth'),
      ('Rock', 'rock'),
      ('Stone', 'stone'),
      ('Boulder', 'boulder'),
      ('Sand', 'sand'),
      ('Clay', 'clay'),
      ('Mud', 'mud'),
      ('Dirt', 'dirt'),
      ('Soil', 'soil'),
      ('Gravel', 'gravel'),
      ('Crystal', 'crystal'),
      ('Mineral', 'mineral'),
      ('Ore', 'ore'),
      ('Gem', 'gem'),
      ('Iron', 'iron'),
      ('Copper', 'copper'),
      ('Gold', 'gold'),
      ('Silver', 'silver'),
      ('Bronze', 'bronze'),
      ('Metal', 'metal'),
      -- Nước & khí quyển
      ('Water', 'water'),
      ('River', 'river'),
      ('Stream', 'stream'),
      ('Lake', 'lake'),
      ('Pond', 'pond'),
      ('Ocean', 'ocean'),
      ('Sea', 'sea'),
      ('Beach', 'beach'),
      ('Rain', 'rain'),
      ('Steam', 'steam'),
      ('Cloud', 'cloud'),
      ('Fog', 'fog'),
      ('Mist', 'mist'),
      ('Wind', 'wind'),
      ('Air', 'air'),
      ('Atmosphere', 'atmosphere'),
      -- Lửa & năng lượng
      ('Fire', 'fire'),
      ('Flame', 'flame'),
      ('Smoke', 'smoke'),
      ('Ash', 'ash'),
      ('Ember', 'ember'),
      ('Spark', 'spark'),
      ('Lightning', 'lightning'),
      ('Thunder', 'thunder'),
      -- Thực vật
      ('Grass', 'grass'),
      ('Plant', 'plant'),
      ('Flower', 'flower'),
      ('Bush', 'bush'),
      ('Shrub', 'shrub'),
      ('Fern', 'fern'),
      ('Moss', 'moss'),
      ('Vine', 'vine'),
      ('Leaf', 'leaf'),
      ('Root', 'root'),
      ('Seed', 'seed'),
      ('Flora', 'flora'),
      ('Crop', 'crop'),
      ('Agriculture', 'agriculture'),
      ('Bamboo', 'bamboo'),
      ('Wood', 'wood'),
      ('Tree', 'tree'),
      ('Vegetation', 'vegetation'),
      ('Mushroom', 'mushroom'),
      ('Fungus', 'fungus'),
      ('Seaweed', 'seaweed'),
      ('Algae', 'algae'),
      ('Wilderness', 'wilderness'),
      ('Grassland', 'grassland'),
      ('Waterfall', 'waterfall'),
      ('Cave', 'cave'),
      ('Biome', 'biome'),
      -- Động vật & sinh vật
      ('Animal', 'animal'),
      ('Wildlife', 'wildlife'),
      ('Fauna', 'fauna'),
      ('Bird', 'bird'),
      ('Fish', 'fish'),
      ('Insect', 'insect'),
      ('Bug', 'bug'),
      ('Mammal', 'mammal'),
      ('Reptile', 'reptile'),
      ('Amphibian', 'amphibian'),
      ('Beast', 'beast'),
      ('Creature', 'creature'),
      -- Vật liệu tự nhiên
      ('Bone', 'bone'),
      ('Leather', 'leather'),
      ('Fur', 'fur'),
      ('Feather', 'feather'),
      ('Shell', 'shell'),
      ('Coral', 'coral'),
      ('Iceberg', 'iceberg'),
      ('Snowflake', 'snowflake'),
      ('Pebble', 'pebble'),
      ('Stalactite', 'stalactite'),
      ('Stalagmite', 'stalagmite')
    ) AS t(name, slug)
  LOOP
    IF EXISTS (SELECT 1 FROM public.tags WHERE slug = tag_rec.slug) THEN
      UPDATE public.tags
      SET name = tag_rec.name,
          group_id = nature_group_id
      WHERE slug = tag_rec.slug;
    ELSE
      INSERT INTO public.tags (id, group_id, name, slug, usage_count, created_at)
      VALUES (gen_random_uuid(), nature_group_id, tag_rec.name, tag_rec.slug, 0, NOW());
    END IF;
  END LOOP;
END;
$seed$;
