// Property Intelligence taxonomy: Category -> Attribute -> Value.
// Confidence, evidence, source, and model version live on the trait record
// (see lib/search-by-design/types.ts), not on the taxonomy itself, so this
// file only ever grows (new categories/attributes) without a schema change.

export type TaxonomyAttribute = {
  key: string;
  label: string;
  /** Free-text phrases a keyword-based parser/extractor should match against. */
  synonyms: string[];
  /** True for attributes where a specific brand/style claim needs strong evidence before being marked "confirmed" rather than "likely". */
  highEvidenceBar?: boolean;
};

export type TaxonomyCategory = {
  key: string;
  label: string;
  attributes: TaxonomyAttribute[];
};

function attr(key: string, label: string, synonyms: string[], highEvidenceBar = false): TaxonomyAttribute {
  return { key, label, synonyms, highEvidenceBar };
}

export const TAXONOMY: TaxonomyCategory[] = [
  {
    key: 'architectural_style',
    label: 'Architectural Style',
    attributes: [
      attr('frank_lloyd_wright_prairie', 'Frank Lloyd Wright / Prairie / Usonian influenced', ['frank lloyd wright', 'prairie', 'usonian', 'wright-inspired', 'wright inspired'], true),
      attr('mid_century_modern', 'Mid-Century Modern', ['mid-century modern', 'mid century modern', 'mcm']),
      attr('tudor', 'Tudor', ['tudor']),
      attr('modern_tudor', 'Modern Tudor', ['modern tudor']),
      attr('georgian', 'Georgian', ['georgian']),
      attr('colonial', 'Colonial', ['colonial']),
      attr('craftsman', 'Craftsman', ['craftsman']),
      attr('mediterranean', 'Mediterranean', ['mediterranean']),
      attr('spanish_revival', 'Spanish Revival', ['spanish revival', 'spanish colonial']),
      attr('french_provincial', 'French Provincial', ['french provincial']),
      attr('french_country', 'French Country', ['french country']),
      attr('contemporary', 'Contemporary', ['contemporary']),
      attr('organic_modern_style', 'Organic Modern', ['organic modern']),
      attr('california_contemporary', 'California Contemporary', ['california contemporary']),
      attr('modern_farmhouse', 'Modern Farmhouse', ['modern farmhouse', 'farmhouse']),
      attr('traditional_style', 'Traditional', ['traditional']),
    ],
  },
  {
    key: 'historic_character',
    label: 'Historic / Character',
    attributes: [
      attr('confirmed_historic_designation', 'Confirmed historic designation', ['historic designation', 'landmark designation', 'registered historic'], true),
      attr('historic_age_property', 'Historic-age property', ['historic age', 'built in 18', 'built in 19']),
      attr('historic_character', 'Historic character', ['historic character', 'period charm', 'old-world charm']),
      attr('original_architectural_details', 'Original architectural details retained', ['original details', 'original architectural detail']),
      attr('original_hardwood', 'Original hardwood', ['original hardwood']),
      attr('original_millwork', 'Original millwork', ['original millwork', 'original trim']),
      attr('leaded_stained_glass_historic', 'Leaded/stained glass', ['leaded glass', 'stained glass']),
      attr('original_masonry_fireplaces', 'Original masonry/fireplaces', ['original masonry', 'original fireplace']),
      attr('extensively_modernized_historic', 'Extensively modernized historic home', ['modernized historic', 'updated historic']),
      attr('turnkey_historic', 'Turnkey historic', ['turnkey historic']),
      attr('historic_fixer', 'Historic fixer', ['historic fixer', 'historic fixer-upper']),
    ],
  },
  {
    key: 'exterior',
    label: 'Exterior',
    attributes: [
      attr('exterior_dominant_color', 'Exterior dominant color', ['exterior color']),
      attr('exterior_secondary_color', 'Secondary exterior color', ['secondary exterior color']),
      attr('white_exterior', 'White exterior', ['white exterior', 'white brick', 'white house']),
      attr('cream_brick', 'Cream brick', ['cream brick']),
      attr('natural_red_brick', 'Natural/red brick', ['red brick', 'natural brick']),
      attr('painted_brick', 'Painted brick', ['painted brick']),
      attr('limestone_exterior', 'Limestone', ['limestone']),
      attr('stone_exterior', 'Stone', ['stone exterior', 'stone facade']),
      attr('stucco_exterior', 'Stucco', ['stucco']),
      attr('wood_exterior', 'Wood', ['wood exterior', 'wood siding']),
      attr('board_and_batten', 'Board-and-batten', ['board and batten', 'board-and-batten']),
      attr('cedar_exterior', 'Cedar', ['cedar exterior', 'cedar siding']),
      attr('dark_contemporary_exterior', 'Dark contemporary exterior', ['dark exterior', 'black exterior']),
      attr('mixed_materials_exterior', 'Mixed materials', ['mixed materials']),
    ],
  },
  {
    key: 'kitchen',
    label: 'Kitchen',
    attributes: [
      attr('cabinet_color', 'Cabinet color', ['cabinet color']),
      attr('cabinet_material', 'Cabinet material', ['cabinet material']),
      attr('white_kitchen', 'White kitchen', ['white kitchen', 'white cabinets']),
      attr('cream_kitchen', 'Cream kitchen', ['cream kitchen', 'cream cabinets']),
      attr('natural_oak_kitchen', 'Natural oak', ['natural oak kitchen', 'warm natural-wood kitchen', 'warm wood kitchen', 'wood kitchen']),
      attr('white_oak_kitchen', 'White oak', ['white oak kitchen']),
      attr('walnut_kitchen', 'Walnut', ['walnut kitchen', 'walnut cabinets']),
      attr('black_kitchen', 'Black kitchen', ['black kitchen', 'black cabinets']),
      attr('green_kitchen', 'Green kitchen', ['green kitchen', 'green cabinets']),
      attr('navy_kitchen', 'Navy kitchen', ['navy kitchen', 'navy cabinets']),
      attr('two_tone_kitchen', 'Two-tone kitchen', ['two-tone kitchen', 'two tone kitchen']),
      attr('countertop_style', 'Countertop style', ['countertop', 'countertops']),
      attr('directional_veining_countertop', 'Strong/directional veining', ['directional veining', 'dramatic veining', 'strong veining']),
      attr('waterfall_island', 'Waterfall island', ['waterfall island', 'waterfall edge']),
      attr('oversized_island', 'Oversized island', ['oversized island', 'large island']),
      attr('double_islands', 'Double islands', ['double islands', 'two islands']),
      attr('prep_kitchen', 'Prep kitchen', ['prep kitchen']),
      attr('scullery', 'Scullery', ['scullery']),
      attr('butler_pantry', 'Butler pantry', ['butler pantry', 'butlers pantry']),
      attr('walk_in_pantry', 'Walk-in pantry', ['walk-in pantry', 'walk in pantry']),
      attr('commercial_style_kitchen', 'Commercial-style kitchen', ['commercial-style kitchen', 'commercial kitchen']),
    ],
  },
  {
    key: 'appliances',
    label: 'Appliance Identification',
    attributes: [
      attr('sub_zero', 'Sub-Zero', ['sub-zero', 'subzero'], true),
      attr('wolf', 'Wolf', ['wolf range', 'wolf appliance'], true),
      attr('thermador', 'Thermador', ['thermador'], true),
      attr('miele', 'Miele', ['miele'], true),
      attr('viking', 'Viking', ['viking appliance'], true),
      attr('monogram', 'Monogram', ['monogram appliance'], true),
      attr('la_cornue', 'La Cornue', ['la cornue'], true),
      attr('built_in_refrigerator', 'Built-in refrigerator', ['built-in refrigerator', 'built-in fridge']),
      attr('commercial_range', 'Commercial range', ['commercial range', 'commercial stove']),
      attr('double_ovens', 'Double ovens', ['double ovens', 'double oven']),
      attr('wine_refrigerator_appliance', 'Wine refrigerator', ['wine refrigerator', 'wine fridge']),
      attr('beverage_refrigerator_appliance', 'Beverage refrigerator', ['beverage refrigerator', 'beverage fridge']),
    ],
  },
  {
    key: 'wine_beverage_bar',
    label: 'Wine / Beverage / Bar',
    attributes: [
      attr('glass_enclosed_wine_room', 'Glass-enclosed temperature-controlled wine room', ['glass-enclosed wine room', 'glass wine room', 'refrigerated glass wine room', 'temperature-controlled wine room']),
      attr('refrigerated_wine_display', 'Refrigerated wine display room', ['refrigerated wine display']),
      attr('walk_in_wine_cellar', 'Walk-in wine cellar', ['walk-in wine cellar', 'walk in wine cellar']),
      attr('wine_wall', 'Wine wall', ['wine wall']),
      attr('traditional_wine_cellar', 'Traditional wine cellar', ['traditional wine cellar', 'wine cellar']),
      attr('wine_refrigerator', 'Wine refrigerator', ['wine refrigerator']),
      attr('full_wet_bar', 'Full wet bar', ['wet bar', 'full wet bar']),
      attr('dry_bar', 'Dry bar', ['dry bar']),
      attr('bar_sink', 'Bar sink', ['bar sink']),
      attr('beverage_refrigerator', 'Beverage refrigerator', ['beverage refrigerator']),
      attr('ice_maker', 'Ice maker', ['ice maker']),
      attr('bottle_display', 'Bottle display', ['bottle display']),
    ],
  },
  {
    key: 'entertainment',
    label: 'Entertainment',
    attributes: [
      attr('dedicated_movie_theater', 'Dedicated movie theater', ['movie theater', 'home theater']),
      attr('media_room', 'Media room', ['media room', 'movie/media room', 'movie room']),
      attr('screening_room', 'Screening room', ['screening room']),
      attr('game_room', 'Game room', ['game room']),
      attr('billiards_room', 'Billiards room', ['billiards room', 'pool table room']),
      attr('music_room', 'Music room', ['music room']),
      attr('entertainment_lounge', 'Entertainment lounge', ['entertainment lounge']),
    ],
  },
  {
    key: 'bathroom',
    label: 'Bathroom',
    attributes: [
      attr('freestanding_soaking_tub', 'Freestanding soaking tub', ['freestanding soaking tub', 'freestanding tub']),
      attr('clawfoot_tub', 'Clawfoot tub', ['clawfoot tub', 'claw foot tub', "claw-foot tub"]),
      attr('built_in_soaking_tub', 'Built-in soaking tub', ['built-in soaking tub']),
      attr('jetted_tub', 'Jetted tub', ['jetted tub']),
      attr('wet_room', 'Wet room', ['wet room']),
      attr('steam_shower', 'Steam shower', ['steam shower']),
      attr('frameless_shower', 'Frameless shower', ['frameless shower']),
      attr('double_shower', 'Double shower', ['double shower']),
      attr('marble_bath', 'Marble bath', ['marble bath', 'marble bathroom']),
      attr('dual_vanities', 'Dual vanities', ['dual vanities', 'double vanity']),
      attr('makeup_vanity', 'Makeup vanity', ['makeup vanity', 'vanity table']),
    ],
  },
  {
    key: 'interior_design',
    label: 'Interior Design / Aesthetic',
    attributes: [
      attr('interior_traditional', 'Traditional', ['traditional interior']),
      attr('interior_transitional', 'Transitional', ['transitional interior']),
      attr('interior_contemporary', 'Contemporary', ['contemporary interior']),
      attr('interior_modern', 'Modern', ['modern interior']),
      attr('interior_organic_modern', 'Organic modern', ['organic modern interior']),
      attr('quiet_luxury', 'Quiet luxury', ['quiet luxury']),
      attr('old_world', 'Old-world', ['old-world', 'old world']),
      attr('european_style', 'European', ['european style', 'european influence']),
      attr('ralph_lauren_inspired', 'Ralph Lauren-inspired', ['ralph lauren']),
      attr('coastal_style', 'Coastal', ['coastal style']),
      attr('minimalist_style', 'Minimalist', ['minimalist']),
      attr('maximalist_style', 'Maximalist', ['maximalist']),
      attr('warm_neutral', 'Warm-neutral', ['warm neutral', 'warm-neutral']),
      attr('cool_neutral', 'Cool-neutral', ['cool neutral', 'cool-neutral']),
      attr('dark_moody', 'Dark/moody', ['dark and moody', 'moody interior']),
      attr('colorful_interior', 'Colorful', ['colorful interior']),
      attr('gray_flip_style', '"Gray flip" style / predominantly cool-gray renovation', ['gray flip', 'gray interior', 'gray interiors', 'all-gray renovation']),
    ],
  },
  {
    key: 'condition_renovation',
    label: 'Condition / Renovation',
    attributes: [
      attr('turnkey', 'Turnkey', ['turnkey']),
      attr('move_in_ready', 'Move-in ready', ['move-in ready', 'move in ready']),
      attr('designer_renovation', 'Designer renovation', ['designer renovation', 'designer reno']),
      attr('high_quality_renovation', 'High-quality renovation', ['high-quality renovation', 'high quality renovation']),
      attr('builder_grade_renovation', 'Builder-grade renovation', ['builder-grade renovation', 'builder grade']),
      attr('recently_renovated', 'Recently renovated', ['recently renovated']),
      attr('partially_renovated', 'Partially renovated', ['partially renovated']),
      attr('cosmetic_opportunity', 'Cosmetic opportunity', ['cosmetic opportunity', 'cosmetic updates needed']),
      attr('major_fixer', 'Major fixer', ['major fixer', 'major fixer-upper', 'fixer upper']),
      attr('original_condition', 'Original condition', ['original condition', 'unrenovated']),
      attr('visible_deferred_maintenance', 'Visible deferred maintenance', ['deferred maintenance']),
      attr('renovated_retaining_character', 'Renovated while retaining original character', ['renovated while retaining character', 'sensitively renovated']),
      attr('generic_modern_farmhouse_reno', 'Generic modern-farmhouse renovation', ['generic modern farmhouse', 'generic modern-farmhouse renovation']),
    ],
  },
  {
    key: 'windows_light',
    label: 'Windows / Natural Light',
    attributes: [
      attr('floor_to_ceiling_windows', 'Floor-to-ceiling windows', ['floor-to-ceiling windows', 'floor to ceiling windows']),
      attr('walls_of_glass', 'Walls of glass', ['walls of glass', 'wall of glass']),
      attr('steel_frame_windows', 'Steel-frame windows', ['steel-frame windows', 'steel frame windows']),
      attr('clerestory_windows', 'Clerestory windows', ['clerestory windows']),
      attr('leaded_glass_windows', 'Leaded glass', ['leaded glass windows']),
      attr('stained_glass_windows', 'Stained glass', ['stained glass windows']),
      attr('exceptional_natural_light', 'Exceptional natural light', ['exceptional natural light', 'abundant natural light']),
    ],
  },
  {
    key: 'flooring',
    label: 'Flooring',
    attributes: [
      attr('original_hardwood_floor', 'Original hardwood', ['original hardwood floors']),
      attr('wide_plank_hardwood', 'Wide-plank hardwood', ['wide-plank hardwood', 'wide plank hardwood']),
      attr('white_oak_floor', 'White oak', ['white oak floors']),
      attr('herringbone_floor', 'Herringbone', ['herringbone floor', 'herringbone']),
      attr('parquet_floor', 'Parquet', ['parquet']),
      attr('terrazzo_floor', 'Terrazzo', ['terrazzo']),
      attr('marble_floor', 'Marble', ['marble floor', 'marble floors']),
      attr('saltillo_floor', 'Saltillo', ['saltillo']),
      attr('polished_concrete_floor', 'Polished concrete', ['polished concrete']),
      attr('carpet_prevalence', 'Carpet prevalence', ['mostly carpet', 'wall-to-wall carpet']),
    ],
  },
  {
    key: 'ceilings_details',
    label: 'Ceilings / Architectural Details',
    attributes: [
      attr('vaulted_ceiling', 'Vaulted', ['vaulted ceiling', 'vaulted ceilings']),
      attr('cathedral_ceiling', 'Cathedral', ['cathedral ceiling']),
      attr('beamed_ceiling', 'Beamed', ['beamed ceiling', 'wooden beams on ceiling', 'wood beam ceiling', 'exposed beams']),
      attr('coffered_ceiling', 'Coffered', ['coffered ceiling']),
      attr('tray_ceiling', 'Tray', ['tray ceiling']),
      attr('barrel_vault_ceiling', 'Barrel vault', ['barrel vault']),
      attr('groin_vault_ceiling', 'Groin vault', ['groin vault']),
      attr('exposed_structure', 'Exposed structure', ['exposed structure', 'exposed trusses']),
      attr('decorative_molding', 'Decorative molding', ['decorative molding', 'crown molding']),
    ],
  },
  {
    key: 'fireplaces',
    label: 'Fireplaces',
    attributes: [
      attr('wood_burning_fireplace', 'Wood-burning', ['wood-burning fireplace', 'wood burning fireplace']),
      attr('gas_fireplace', 'Gas', ['gas fireplace']),
      attr('stone_fireplace', 'Stone', ['stone fireplace']),
      attr('masonry_fireplace', 'Masonry', ['masonry fireplace']),
      attr('marble_fireplace', 'Marble', ['marble fireplace']),
      attr('linear_fireplace', 'Linear', ['linear fireplace']),
      attr('double_sided_fireplace', 'Double-sided', ['double-sided fireplace', 'see-through fireplace']),
      attr('primary_bedroom_fireplace', 'Primary-bedroom fireplace', ['primary bedroom fireplace', 'bedroom fireplace']),
      attr('outdoor_fireplace', 'Outdoor fireplace', ['outdoor fireplace']),
    ],
  },
  {
    key: 'specialty_rooms',
    label: 'Specialty Rooms',
    attributes: [
      attr('library', 'Library', ['library']),
      attr('home_office', 'Home office', ['home office', 'study']),
      attr('gym', 'Gym', ['gym', 'home gym', 'fitness room']),
      attr('sauna', 'Sauna', ['sauna']),
      attr('steam_room', 'Steam room', ['steam room']),
      attr('craft_room', 'Craft room', ['craft room']),
      attr('studio', 'Studio', ['studio']),
      attr('safe_room', 'Safe room', ['safe room', 'panic room']),
      attr('cigar_room', 'Cigar room', ['cigar room']),
      attr('trophy_room', 'Trophy room', ['trophy room']),
      attr('wrapping_room', 'Wrapping room', ['wrapping room', 'gift wrap room']),
      attr('secondary_laundry', 'Secondary laundry', ['secondary laundry', 'second laundry room']),
    ],
  },
  {
    key: 'primary_suite',
    label: 'Primary Suite / Closet',
    attributes: [
      attr('primary_sitting_room', 'Sitting room', ['primary sitting room', 'sitting room']),
      attr('primary_fireplace', 'Fireplace', ['primary suite fireplace']),
      attr('primary_private_outdoor_access', 'Private outdoor access', ['private outdoor access']),
      attr('primary_coffee_bar', 'Coffee bar', ['primary coffee bar', 'coffee bar']),
      attr('dual_bathrooms', 'Dual bathrooms', ['dual bathrooms', 'his and hers bathrooms']),
      attr('dual_closets', 'Dual closets', ['dual closets', 'his and hers closets']),
      attr('large_dressing_room', 'Large dressing room', ['large dressing room', 'dressing room']),
      attr('closet_island', 'Closet island', ['closet island']),
      attr('glass_front_closet_cabinetry', 'Glass-front closet cabinetry', ['glass-front closet']),
      attr('shoe_wall', 'Shoe wall', ['shoe wall']),
    ],
  },
  {
    key: 'functional_layout',
    label: 'Functional Layout',
    attributes: [
      attr('multigenerational', 'Multigenerational', ['multigenerational', 'multi-generational']),
      attr('separate_guest_suite', 'Separate guest suite', ['separate guest suite', 'guest suite']),
      attr('private_guest_entrance', 'Private guest entrance', ['private guest entrance']),
      attr('childrens_wing', "Children's wing", ["children's wing", 'kids wing']),
      attr('first_floor_primary', 'First-floor primary', ['first-floor primary', 'main-level primary', 'primary on main']),
      attr('work_from_home_suitability', 'Work-from-home suitability', ['work from home', 'home office setup']),
      attr('entertainer_layout', 'Entertainer layout', ['entertainer layout', 'great for entertaining']),
      attr('lock_and_leave', 'Lock-and-leave', ['lock and leave', 'lock-and-leave']),
      attr('separated_guest_quarters', 'Separated guest quarters', ['separated guest quarters']),
    ],
  },
  {
    key: 'lot_privacy_landscaping',
    label: 'Lot / Privacy / Landscaping',
    attributes: [
      attr('mature_trees', 'Mature trees', ['mature trees']),
      attr('heavily_wooded', 'Heavily wooded', ['heavily wooded', 'wooded lot']),
      attr('high_backyard_privacy', 'High backyard privacy', ['backyard privacy', 'private backyard']),
      attr('formal_gardens', 'Formal gardens', ['formal gardens']),
      attr('courtyard', 'Courtyard', ['courtyard']),
      attr('creek', 'Creek', ['creek', 'creek lot']),
      attr('golf_course_frontage', 'Golf-course frontage', ['golf course frontage', 'golf course lot']),
      attr('oversized_lot', 'Oversized lot', ['oversized lot']),
      attr('estate_lot', 'Estate lot', ['estate lot']),
      attr('corner_exposure', 'Corner exposure', ['corner lot']),
      attr('low_rear_neighbor_exposure', 'Low rear-neighbor exposure', ['no rear neighbors', 'low rear neighbor exposure']),
    ],
  },
  {
    key: 'outdoor_living',
    label: 'Outdoor Living',
    attributes: [
      attr('outdoor_kitchen', 'Outdoor kitchen', ['outdoor kitchen']),
      attr('covered_living_area', 'Covered living area', ['covered patio', 'covered living area']),
      attr('screened_porch', 'Screened porch', ['screened porch']),
      attr('cabana', 'Cabana', ['cabana']),
      attr('pergola', 'Pergola', ['pergola']),
      attr('outdoor_fireplace_living', 'Fireplace', ['outdoor living fireplace']),
      attr('pizza_oven', 'Pizza oven', ['pizza oven']),
      attr('outdoor_bar', 'Outdoor bar', ['outdoor bar']),
    ],
  },
  {
    key: 'pool_spa',
    label: 'Pool / Spa',
    attributes: [
      attr('infinity_pool', 'Infinity', ['infinity pool']),
      attr('geometric_pool', 'Geometric', ['geometric pool']),
      attr('lagoon_pool', 'Lagoon', ['lagoon pool']),
      attr('lap_pool', 'Lap pool', ['lap pool']),
      attr('plunge_pool', 'Plunge pool', ['plunge pool']),
      attr('spa', 'Spa', ['spa', 'hot tub']),
      attr('tanning_ledge', 'Tanning ledge', ['tanning ledge', 'sun shelf']),
    ],
  },
  {
    key: 'garage_auto',
    label: 'Garage / Auto',
    attributes: [
      attr('garage_3plus', '3+ car', ['3-car garage', 'three car garage', '3+ car garage']),
      attr('garage_4plus', '4+ car', ['4-car garage', 'four car garage', '4+ car garage']),
      attr('climate_controlled_garage', 'Climate-controlled', ['climate-controlled garage', 'climate controlled garage']),
      attr('car_lift', 'Car lift', ['car lift']),
      attr('showroom_garage', 'Showroom-style garage', ['showroom garage', 'showroom-style garage']),
      attr('porte_cochere', 'Porte-cochère', ['porte-cochere', 'porte cochere']),
      attr('motor_court', 'Motor court', ['motor court']),
    ],
  },
];

export function findAttribute(categoryKey: string, attributeKey: string): TaxonomyAttribute | undefined {
  return TAXONOMY.find((c) => c.key === categoryKey)?.attributes.find((a) => a.key === attributeKey);
}

export function allAttributes(): Array<{ category: TaxonomyCategory; attribute: TaxonomyAttribute }> {
  return TAXONOMY.flatMap((category) => category.attributes.map((attribute) => ({ category, attribute })));
}

/** Lowercase + collapse whitespace so synonym matching is stable regardless of source formatting. */
export function normalizeText(input: string): string {
  return input.toLowerCase().replace(/\s+/g, ' ').trim();
}
