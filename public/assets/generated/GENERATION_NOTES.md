# Modak Mahal generated environment proof

## Recommended integration asset

- Game-size background with the Steamer 2 approach opened: `bg_hall_illustrated-v3-clean.png` (`960 x 540`)
- Previous integrated background: `bg_hall_illustrated-v2.png` (`960 x 540`)
- High-resolution master: `bg_hall_illustrated-master-v2.png`
- Earlier style proof: `bg_hall_illustrated-v1.png` and `bg_hall_illustrated-master-v1.png`

V3 is the current integration candidate. V1 established the painted art style but drifted from the rectangular game layout; V2 established the corrected rectangular layout.

V3 is a non-destructive correction of v2. It removes the baked fence and obstructing planter from the Steaming compartment frontage and restores a continuous cream-tiled approach. The rest of the hall remains based on v2. When V3 is integrated, remove the matching `rail_steaming_front` collision blocker and its pending-fence debug annotation in the same change.

## Reference roles

- Current game screenshot: required department geometry and playable layout.
- Approved Modak Mahal concept: visual quality, festival atmosphere, and 2.5D illustration direction.
- V1 generated hall: material finish, lighting, palette, and rendering consistency.

## Final generation prompt

Create an empty, original, illustrated Modak Mahal hall at exact 16:9 composition for a `960 x 540` Phaser world. Preserve the rectangular playable organization of the current game: locked staircase at far left; Supplies, Steaming, and management bays across the upper hall; a clear central aisle; rectangular Packing and Service rooms in the lower hall; a separate customer lane at far right; and an empty respectful lower-left alcove reserved for a separately composited Ganesha pandal. Use a polished hand-painted 2.5D management-game style with warm cream tile, carved walnut, brass, garlands, plants, crisp contours, and consistent soft lighting. Generate architecture and permanent edge decoration only. Exclude all people, characters, text, signs, UI, arrows, shelves, steamers, desks, benches, counters, inventory, food, boxes, coins, machines, shrine, idol, and other gameplay-controlled objects. Keep doorways and circulation paths unobstructed.

## Integration rule

This is a visual proof asset, not a complete scene. Load it as the base background while keeping stations, characters, state-dependent props, UI, effects, and collisions controlled by Phaser. Verify collision alignment in-browser before removing any existing architectural collision geometry.
