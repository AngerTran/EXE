-- Mở rộng tags theo chuẩn itch.io: phong cách, thể loại, chủ đề, nền tảng, kỹ thuật, UI, phương tiện.
-- Chạy: dotnet run --project BE/scripts/SeedItchIoExpansionTags

DO $seed$
DECLARE
  style_group_id uuid;
  genre_group_id uuid;
  theme_group_id uuid;
  platform_group_id uuid;
  technical_group_id uuid;
  ui_group_id uuid;
  vehicle_group_id uuid;
  tag_rec record;
BEGIN
  SELECT id INTO style_group_id FROM public.tag_groups WHERE slug = 'style' LIMIT 1;
  SELECT id INTO genre_group_id FROM public.tag_groups WHERE slug = 'genre' LIMIT 1;
  SELECT id INTO theme_group_id FROM public.tag_groups WHERE slug = 'theme' LIMIT 1;
  SELECT id INTO platform_group_id FROM public.tag_groups WHERE slug = 'platform' LIMIT 1;
  SELECT id INTO technical_group_id FROM public.tag_groups WHERE slug = 'technical' LIMIT 1;
  SELECT id INTO ui_group_id FROM public.tag_groups WHERE slug = 'ui-components' LIMIT 1;
  SELECT id INTO vehicle_group_id FROM public.tag_groups WHERE slug = 'vehicles' LIMIT 1;

  IF style_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT *
      FROM (VALUES
        ('Voxel', 'voxel'),
        ('Cel-Shaded', 'cel-shaded'),
        ('Flat Color', 'flat-color'),
        ('Noir / Monochrome', 'noir-monochrome'),
        ('Vector', 'vector'),
        ('Game Boy', 'game-boy'),
        ('GBA', 'gba'),
        ('NES', 'nes'),
        ('Sega Genesis', 'sega-genesis'),
        ('Gothic', 'gothic')
      ) AS t(name, slug)
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
      SELECT *
      FROM (VALUES
        ('Visual Novel', 'visual-novel'),
        ('Bullet Hell', 'bullet-hell'),
        ('Metroidvania', 'metroidvania'),
        ('Clicker / Idle', 'clicker-idle'),
        ('Walking Simulator', 'walking-simulator'),
        ('Tower Defense', 'tower-defense'),
        ('FPS', 'fps'),
        ('TPS', 'tps'),
        ('Fighting', 'fighting'),
        ('Card Game', 'card-game'),
        ('Deckbuilder', 'deckbuilder'),
        ('Rhythm', 'rhythm')
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

  IF theme_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT *
      FROM (VALUES
        ('Mythology', 'mythology'),
        ('Pirate', 'pirate'),
        ('Historical', 'historical'),
        ('Alien', 'alien'),
        ('Manga', 'manga'),
        ('Abstract', 'abstract'),
        ('School', 'school'),
        ('Hospital', 'hospital'),
        ('Asylum', 'asylum'),
        ('Solarpunk', 'solarpunk'),
        ('Biopunk', 'biopunk'),
        ('Oasis', 'oasis'),
        ('Volcano', 'volcano'),
        ('Lava', 'lava'),
        ('Winter', 'winter'),
        ('Ice', 'ice'),
        ('Deep Sea', 'deep-sea'),
        ('Swamp', 'swamp'),
        ('Marsh', 'marsh'),
        ('Sky', 'sky'),
        ('Floating Island', 'floating-island'),
        ('Mecha', 'mecha'),
        ('Robot', 'robot'),
        ('Retro-Futurism', 'retro-futurism'),
        ('Dystopian', 'dystopian'),
        ('Lovecraftian', 'lovecraftian'),
        ('Cosmic Horror', 'cosmic-horror'),
        ('Psychological Horror', 'psychological-horror'),
        ('Vampire', 'vampire'),
        ('Werewolf', 'werewolf'),
        ('Zombie Apocalypse', 'zombie-apocalypse'),
        ('Surreal', 'surreal'),
        ('Dreamcore', 'dreamcore'),
        ('Weirdcore', 'weirdcore'),
        ('Suburb', 'suburb'),
        ('Cooking', 'cooking'),
        ('Restaurant', 'restaurant'),
        ('Crafting', 'crafting'),
        ('Oriental', 'oriental'),
        ('Eastern', 'eastern'),
        ('Asian', 'asian'),
        ('Wild West', 'wild-west'),
        ('Western', 'western'),
        ('Nautical', 'nautical'),
        ('Kawaii', 'kawaii'),
        ('Comedy', 'comedy'),
        ('Parody', 'parody')
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

  IF platform_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT *
      FROM (VALUES
        ('Web', 'web'),
        ('WebGL', 'webgl'),
        ('HTML5', 'html5'),
        ('Windows', 'windows'),
        ('macOS', 'macos'),
        ('Linux', 'linux'),
        ('Android', 'android'),
        ('iOS', 'ios'),
        ('Unity', 'unity'),
        ('Unreal Engine', 'unreal-engine'),
        ('Godot', 'godot'),
        ('GameMaker', 'gamemaker'),
        ('Game Jam', 'game-jam')
      ) AS t(name, slug)
    LOOP
      IF EXISTS (SELECT 1 FROM public.tags WHERE slug = tag_rec.slug) THEN
        UPDATE public.tags SET name = tag_rec.name, group_id = platform_group_id WHERE slug = tag_rec.slug;
      ELSE
        INSERT INTO public.tags (id, group_id, name, slug, usage_count, created_at)
        VALUES (gen_random_uuid(), platform_group_id, tag_rec.name, tag_rec.slug, 0, NOW());
      END IF;
    END LOOP;
  END IF;

  IF technical_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT *
      FROM (VALUES
        ('3D Models', '3d-models'),
        ('Mesh', 'mesh'),
        ('2D', '2d'),
        ('Sprites', 'sprites'),
        ('High Poly', 'high-poly'),
        ('Unrigged', 'unrigged'),
        ('VFX', 'vfx'),
        ('Shaders', 'shaders'),
        ('Materials', 'materials'),
        ('Fonts', 'fonts'),
        ('8x8', '8x8'),
        ('32x32', '32x32'),
        ('64x64', '64x64'),
        ('Tileable', 'tileable'),
        ('Voice Acting', 'voice-acting'),
        ('Foley', 'foley')
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
      SELECT *
      FROM (VALUES
        ('Inventory', 'inventory'),
        ('Minimap', 'minimap'),
        ('Skill Tree', 'skill-tree'),
        ('Dialogue Box', 'dialogue-box'),
        ('Crosshair', 'crosshair'),
        ('Main Menu', 'main-menu'),
        ('Splash Screen', 'splash-screen'),
        ('Shop UI', 'shop-ui'),
        ('Merchant UI', 'merchant-ui')
      ) AS t(name, slug)
    LOOP
      IF EXISTS (SELECT 1 FROM public.tags WHERE slug = tag_rec.slug) THEN
        UPDATE public.tags SET name = tag_rec.name, group_id = ui_group_id WHERE slug = tag_rec.slug;
      ELSE
        INSERT INTO public.tags (id, group_id, name, slug, usage_count, created_at)
        VALUES (gen_random_uuid(), ui_group_id, tag_rec.name, tag_rec.slug, 0, NOW());
      END IF;
    END LOOP;
  END IF;

  IF vehicle_group_id IS NOT NULL THEN
    FOR tag_rec IN
      SELECT *
      FROM (VALUES
        ('Aircraft', 'aircraft'),
        ('Airplane', 'airplane'),
        ('Helicopter', 'helicopter'),
        ('Boat', 'boat'),
        ('Ship', 'ship'),
        ('Submarine', 'submarine'),
        ('Train', 'train'),
        ('Tram', 'tram'),
        ('Spaceship', 'spaceship'),
        ('Motorcycle', 'motorcycle'),
        ('Bicycle', 'bicycle')
      ) AS t(name, slug)
    LOOP
      IF EXISTS (SELECT 1 FROM public.tags WHERE slug = tag_rec.slug) THEN
        UPDATE public.tags SET name = tag_rec.name, group_id = vehicle_group_id WHERE slug = tag_rec.slug;
      ELSE
        INSERT INTO public.tags (id, group_id, name, slug, usage_count, created_at)
        VALUES (gen_random_uuid(), vehicle_group_id, tag_rec.name, tag_rec.slug, 0, NOW());
      END IF;
    END LOOP;
  END IF;
END;
$seed$;
