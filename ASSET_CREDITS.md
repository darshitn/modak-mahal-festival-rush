# Modak Mahal — Asset and Art Credits

## 1. Visual Target & Art Direction
- **Reference Artwork**: `approved_hall_illustration.png` (`d:/Projects/Ekara/public/assets/approved_hall_illustration.png`)
  - **Description**: Approved Modak Mahal hall illustration concept preview showing the 3D-looking 2.5D illustrated department compartments (Supplies, Steaming Kitchen, Packing, Service, Dispatch), locked first-floor staircase, warm cream flooring, walnut partition trims, and festive decor.
  - **Status**: Official visual target for Modak Mahal redesign.

## 2. In-Game Procedural Art Pipeline
- **Generator**: `src/scenes/BootScene.ts`
- **Technique**: High-resolution 2D Canvas asset generation pipeline with `artScale = 2` rendering to dynamic Phaser textures.
- **Style**: Illustrated 2.5D top-down view with warm cream tiles, walnut wood outlines (`#45362e`), shallow furniture front faces, consistent soft drop shadows (`rgba(69, 54, 46, 0.25)`), rich brass metallic gradients, and state-backed visual queues.
- **Assets Generated**:
  - `staircase_locked`: Wooden staircase with red runner, brass handrail, red velvet rope with brass stanchions, and "First floor — later upgrade" plaque.
  - `dept_badge_supplies`: "1 SUPPLIES" green department pill badge.
  - `dept_badge_steaming`: "2 STEAMING" green department pill badge.
  - `station_supply_shelf`: Multi-tier teak shelving unit with sacks of Rice Flour, Wheat Flour, Coconut, and glass spice jars of Jaggery and Elaichi.
  - `goods_in_sacks`: Stacked burlap ingredient sacks on pallet with "GOODS IN" sign.
  - `station_steamer_brass`: 3-tiered traditional brass steamer pot with handles, domed lid, and stove base with glowing charcoal embers.
  - `steamer_input_table`: Stainless/wood prep counter with "Input" label.
  - `steamer_output_table`: Stainless/wood prep counter with "Cooked Modaks" label and banana leaf platter.
  - `tray_wrapped_bundle`: Stainless prep tray with white muslin-wrapped recipe bundle tied with saffron cord.
  - `tray_cooked_modaks`: Fresh white conical ridged steamed modaks with saffron kesar dots on banana leaf.
  - `station_steamer_blueprint`: Dashed blueprint outline with brass pot silhouette and "Add Another Steamer Later • ₹90".
  - `plant_pot`: Terracotta/brass indoor pot with lush foliage for doorway pillars.
  - `wall_pillar`: Wooden-capped sandstone architectural pillar.
  - `wall_partition_h`: Low horizontal partition wall with warm cream stone and dark walnut coping.
  - `wall_partition_v`: Vertical partition wall segment.
  - `player`: Shopkeeper in cream kurta, saffron apron, red sash, and traditional topi.
  - `staff_packer`: Worker NPC in forest green festive kurta and yellow apron.
  - `staff_cashier`: Cashier NPC in royal purple festive kurta and gold stole.
  - `customer`: Festival devotees in festive clothing and sarees.
  - `item_bundle`, `item_batch`, `item_box`, `coin`: Production and inventory items.
  - `diya`: Traditional brass oil lamps with flickering animated flames.
  - `particle_steam`: Translucent radial steam puff.
  - `particle_petal`: Festive marigold petals.

## 3. Illustrated Raster Assets
- **Ganesha Pandal (Active)**: `pandal_ganesha-v2.png` (`public/assets/generated/pandal_ganesha-v2.png`)
  - **Description**: Transparent 1254x1254 PNG containing a complete stationary festive Ganesha shrine, carved wooden archway, marigold garlands, hanging lamps, pedestal oil lamps, and brass modak offering plate. Updated palette with rich walnut matching hall architecture and warm, muted antique brass tones.
  - **Tool / Provenance**: Generated with OpenAI's built-in image-generation tool.
  - **Role**: Stationary decorative shrine in lower-left pandal alcove.
- **Ganesha Pandal (Previous / Rollback Asset)**: `pandal_ganesha-v1.png` (`public/assets/generated/pandal_ganesha-v1.png`)
  - **Description**: Initial transparent 1254x1254 PNG proof with brighter golden brass and lighter wood tones. Kept for rollback preservation.
- **Hall Environment Background**: `bg_hall_illustrated-v3-clean.png` (`public/assets/generated/bg_hall_illustrated-v3-clean.png`)
  - **Description**: Illustrated 960x540 2.5D production hall environment background with open Steamer 2 approach and dedicated department compartments.
- **Brass Steamer**: `steamer_brass-v1.png` (`public/assets/generated/steamer_brass-v1.png`)
  - **Description**: Transparent 1177x1336 PNG containing a 3-tier traditional antique brass steamer pot with closed domed lid, finial, loop handles, and dark charcoal stone stove burner plinth.
  - **Tool / Provenance**: Generated with OpenAI's built-in image-generation tool.
  - **Role**: Central cooking appliance for Steamer 1 and Steamer 2.
- **Steamer Input Table**: `steamer_input_table-v1.png` (`public/assets/generated/steamer_input_table-v1.png`)
  - **Description**: Transparent 1313x1198 PNG containing a walnut prep table with beveled stainless steel tabletop and lower storage shelf. Surface is clean and empty to dynamically receive queued wrapped recipe bundles.
  - **Tool / Provenance**: Generated with OpenAI's built-in image-generation tool.
  - **Role**: Input receiving prep counter for Steamer 1 and Steamer 2.
- **Steamer Output Table**: `steamer_output_table-v1.png` (`public/assets/generated/steamer_output_table-v1.png`)
  - **Description**: Transparent 1313x1198 PNG containing a walnut serving counter with recessed fresh green banana-leaf serving tray and lower storage shelf. Surface is clean and empty to dynamically receive fresh cooked modaks.
  - **Tool / Provenance**: Generated with OpenAI's built-in image-generation tool.
  - **Role**: Cooked modaks output serving counter for Steamer 1 and Steamer 2.
- **Supply Shelf V2 (Active)**: `station_supply_shelf-v2.png` (`public/assets/generated/station_supply_shelf-v2.png`)
  - **Description**: Transparent 1387x1134 PNG containing a front-facing, horizontally level traditional dark-teak multi-tier ingredient shelving unit with brass bowls of coconut and flours, jaggery, spice canisters, and festive marigold garland. Corrects previous perspective tilt.
  - **Tool / Provenance**: Generated with OpenAI's built-in image-generation tool.
  - **Role**: Primary furniture piece for Ingredient / Supply Shelf station in Compartment 1.
- **Supply Shelf V1 (Rollback Asset)**: `station_supply_shelf-v1.png` (`public/assets/generated/station_supply_shelf-v1.png`)
  - **Description**: Transparent 1388x1133 PNG containing the original 3/4 angled shelf asset. Kept for rollback preservation.
  - **Tool / Provenance**: Generated with OpenAI's built-in image-generation tool.
- **Packing Bench**: `station_packing_bench-v1.png` (`public/assets/generated/station_packing_bench-v1.png`)
  - **Description**: Transparent 1568x1003 PNG containing an illustrated walnut packing workbench with brass fittings, dedicated fresh banana-leaf receiving tray on the left, clear central packaging surface, and organized packing materials on the right.
  - **Tool / Provenance**: Generated using OpenAI's built-in image-generation tool for this project.
  - **Role**: Main furniture piece for Packing & Boxing station in Compartment 3.
- **Service Counter**: `station_service_counter-v1.png` (`public/assets/generated/station_service_counter-v1.png`)
  - **Description**: Transparent 1683x935 PNG containing an illustrated low walnut counter with carved trim, warm festive gold/maroon runner, and wide smooth countertop for customer modak box presentation.
  - **Tool / Provenance**: Generated using OpenAI's built-in image-generation tool for this project.
  - **Role**: Main furniture piece for Service Counter station in Compartment 4.
- **Upgrade Desk**: `station_upgrade_desk-v1.png` (`public/assets/generated/station_upgrade_desk-v1.png`)
  - **Description**: Transparent 1515x1038 PNG containing an illustrated ornate walnut accountant/manager's desk with gold trim, ledger book, brass inkpot, quill, scroll, and fresh marigold offerings.
  - **Tool / Provenance**: Generated using OpenAI's built-in image-generation tool for this project.
  - **Role**: Main furniture piece for Upgrade Station in Compartment 5 (Manager's Office).
- **Packer Staff NPC**: `staff_packer-v1.png` (`public/assets/generated/staff_packer-v1.png`)
  - **Description**: Transparent 1024x1536 PNG containing an illustrated Indian confectionery worker in dark green festive kurta and gold trim, hands ready to pack modaks.
  - **Tool / Provenance**: Generated using OpenAI's built-in image-generation tool for this project.
  - **Role**: Retained as an unused visual alternative. The active game uses the original procedural `staff_packer` sprite for character-scale consistency.
- **Cashier Staff NPC**: `staff_cashier-v1.png` (`public/assets/generated/staff_cashier-v1.png`)
  - **Description**: Transparent 1024x1536 PNG containing an illustrated Indian shopkeeper in royal purple festive kurta, gold trim, and traditional turban, performing warm welcoming greetings.
  - **Tool / Provenance**: Generated using OpenAI's built-in image-generation tool for this project.
  - **Role**: Retained as an unused visual alternative. The active game uses the original procedural `staff_cashier` sprite for character-scale consistency.
- **Cooked Modak Platter**: `modak_platter-v1.png` (`public/assets/generated/modak_platter-v1.png`)
  - **File**: `public/assets/generated/modak_platter-v1.png`
  - **Description**: Transparent 1536×1024 illustrated platter containing exactly three detailed steamed modaks on a banana-leaf-lined brass thali.
  - **Provenance**: Generated using OpenAI’s built-in image-generation tool.
  - **Purpose**: Tutorial hero artwork and state-driven cooked-modak presentation at Steamer and Packing stations.

## 4. Typography
- **Outfit**: Primary UI and station font (Google Fonts, SIL Open Font License 1.1).
- **Yatra One**: Festival header font (Google Fonts, SIL Open Font License 1.1).

## 5. Software & Engine
- **Phaser 3.90.0**: HTML5 Game Framework (MIT License, Richard Davey).
- **Vite 6**: Frontend tooling (MIT License).
- **TypeScript 5**: Language (Apache License 2.0).
