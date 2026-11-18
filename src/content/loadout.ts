export type Who = 'jason' | 'lucia' | 'both'
export type GearShot = { id: string; label: string; who?: Who; paint?: boolean; focus?: [number, number, number] }
export type GearItem = { id: string; name: string; sub: string; pack: 'Ultimate Edition' | 'Vintage Vice City Pack'; shots: GearShot[]; note: string }

export const wardrobe: GearItem[] = [
  {
    id: 'vice-city-style',
    name: 'Vice City Style',
    sub: 'Silk prints, tiger boots, big collars',
    pack: 'Ultimate Edition',
    note: 'Loud shirts and louder boots, made for the waterfront.',
    shots: [
      { id: 'ue-vice-city-style-01', label: 'Poolside', who: 'both' },
      { id: 'ue-vice-city-style-02', label: 'Back print', who: 'jason' },
      { id: 'ue-vice-city-style-03', label: 'Tiger boots', who: 'lucia' },
      { id: 'ue-vice-city-style-04', label: 'Balcony', who: 'jason' },
      { id: 'ue-vice-city-style-05', label: 'Night out', who: 'lucia' },
    ],
  },
  {
    id: 'vintage-looks',
    name: 'Vintage Vice City',
    sub: 'Pastel suits, sequins, big hair',
    pack: 'Vintage Vice City Pack',
    note: 'A throwback to the city when the neon burned brightest.',
    shots: [
      { id: 'vvc-edition-01', label: 'Ocean View', who: 'both', focus: [0.42, 0.45, 1.1] },
      { id: 'vvc-exclusive-looks-01', label: 'Dance floor', who: 'both' },
      { id: 'vvc-exclusive-looks-02', label: 'Close-up', who: 'lucia' },
      { id: 'vvc-exclusive-looks-03', label: 'Pastel jacket', who: 'jason' },
      { id: 'vvc-exclusive-looks-04', label: 'Sequins', who: 'lucia' },
      { id: 'vvc-exclusive-looks-05', label: 'Tinted shades', who: 'jason' },
      { id: 'vvc-edition-02', label: 'Docks at dusk', who: 'both' },
    ],
  },
  {
    id: 'ultimate-looks',
    name: 'Ultimate Looks',
    sub: 'Sunset patterns and sharp shades',
    pack: 'Ultimate Edition',
    note: 'The edition’s signature look, shown off at golden hour.',
    shots: [
      { id: 'ue-edition-01', label: 'Golden hour', who: 'both' },
      { id: 'ue-edition-02', label: 'Downtown', who: 'both' },
    ],
  },
  {
    id: 'goodtime-gear',
    name: 'Goodtime Gear',
    sub: 'Souvenir tees and caps',
    pack: 'Ultimate Edition',
    note: 'Tourist merch, worn without irony.',
    shots: [{ id: 'ue-goodtime-gear-01', label: 'Matching set', who: 'both' }],
  },
  {
    id: 'stock-305',
    name: 'Stock 305',
    sub: 'Streetwear store',
    pack: 'Ultimate Edition',
    note: 'Graffiti walls, denim and leopard print.',
    shots: [
      { id: 'ue-stock-305-01', label: 'On the van', who: 'both' },
      { id: 'ue-stock-305-02', label: 'Denim jacket', who: 'jason' },
      { id: 'ue-stock-305-04', label: 'At the counter', who: 'lucia' },
      { id: 'ue-stock-305-03', label: 'Storefront', who: 'both' },
    ],
  },
  {
    id: 'saras-salon',
    name: 'Sara’s Salon',
    sub: 'Cuts, colour and nails',
    pack: 'Ultimate Edition',
    note: 'New hair, new nails, same trouble.',
    shots: [
      { id: 'ue-saras-salon-02', label: 'Fresh cut', who: 'jason' },
      { id: 'ue-saras-salon-03', label: 'Nails done', who: 'lucia' },
      { id: 'ue-saras-salon-01', label: 'Waiting room', who: 'both' },
    ],
  },
  {
    id: 'electric-fang',
    name: 'Electric Fang Tattoo',
    sub: 'Ink parlour',
    pack: 'Ultimate Edition',
    note: 'Neon wolf on the sign, fresh ink in the chair.',
    shots: [
      { id: 'ue-electric-fang-04', label: 'Back piece', who: 'jason' },
      { id: 'ue-electric-fang-03', label: 'In the chair', who: 'both' },
      { id: 'ue-electric-fang-01', label: 'Out front', who: 'both' },
      { id: 'ue-electric-fang-02', label: 'Session', who: 'both' },
    ],
  },
]

export const weapons: GearItem[] = [
  {
    id: 'hawk-little-morgan',
    name: 'Hawk & Little Morgan',
    sub: 'Engraved revolvers',
    pack: 'Ultimate Edition',
    note: 'A matched pair of revolvers with palm-engraved grips and a scope.',
    shots: [
      { id: 'ue-hawk-and-little-morgan-revolvers-02', label: 'The pair', focus: [0.45, 0.5, 1.05] },
      { id: 'ue-hawk-and-little-morgan-revolvers-01', label: 'In hand' },
    ],
  },
  {
    id: 'custom-finishes',
    name: 'Custom Finishes',
    sub: 'Pistol finishes',
    pack: 'Ultimate Edition',
    note: 'Pistols with custom engraved and painted finishes.',
    shots: [{ id: 'ue-weapon-variants-01', label: 'Two finishes' }],
  },
  {
    id: 'vintage-pattern',
    name: 'Vintage Pattern',
    sub: 'Patterned compact SMG',
    pack: 'Vintage Vice City Pack',
    note: 'A compact SMG in a vintage pattern, straight out of the eighties.',
    shots: [
      { id: 'vvc-weapon-pattern-01', label: 'On the seat' },
      { id: 'vvc-exclusive-looks-03', label: 'In hand' },
    ],
  },
]

export const garage: GearItem[] = [
  {
    id: 'grotti-cheetah',
    name: '’95 Grotti Cheetah',
    sub: 'Pop-up headlights, striped white',
    pack: 'Ultimate Edition',
    note: 'A low white wedge with red pinstripes, parked at the Pegasus South Tower.',
    shots: [
      { id: 'ue-grotti-cheetah-01', label: 'Front three-quarter', paint: true, focus: [0.34, 0.72, 1.35] },
      { id: 'ue-grotti-cheetah-02', label: 'Lights up', paint: true, focus: [0.62, 0.62, 1.05] },
      { id: 'ue-grotti-cheetah-03', label: 'Rear', paint: true, focus: [0.5, 0.55, 1.05] },
      { id: 'ue-grotti-cheetah-04', label: 'Interior' },
    ],
  },
  {
    id: 'vapid-stanier',
    name: '’55 Vapid Stanier',
    sub: 'Two-tone chrome cruiser',
    pack: 'Vintage Vice City Pack',
    note: 'Two-tone paint, whitewalls and tail fins under the neon.',
    shots: [
      { id: 'vvc-vapid-stanier-01', label: 'Under the neon', paint: true, focus: [0.55, 0.6, 1.05] },
      { id: 'vvc-vapid-stanier-03', label: 'Whitewalls', paint: true, focus: [0.45, 0.55, 1.05] },
      { id: 'vvc-vapid-stanier-04', label: 'Tail fin', focus: [0.4, 0.5, 1.05] },
      { id: 'vvc-vapid-stanier-02', label: 'Front seat' },
    ],
  },
  {
    id: 'ganado-retro',
    name: 'Vapid Ganado Retro',
    sub: 'Retro build pickup',
    pack: 'Ultimate Edition',
    note: 'A muscle pickup with a hood scoop, smoking its tyres by the sea.',
    shots: [{ id: 'ue-vapid-ganado-retro-build-01', label: 'Burnout', paint: true, focus: [0.5, 0.62, 1.08] }],
  },
  {
    id: 'vapid-buggy',
    name: 'Vapid Buggy',
    sub: 'Lifted mud runner',
    pack: 'Ultimate Edition',
    note: 'A lifted muscle car with light bars, built for the swamp roads.',
    shots: [
      { id: 'ue-vapid-buggy-01', label: 'In the mud', paint: true, focus: [0.33, 0.58, 1.3] },
      { id: 'ue-vapid-buggy-04', label: 'Garage', paint: true, focus: [0.5, 0.6, 1.12] },
      { id: 'ue-vapid-buggy-02', label: 'Bull bar' },
      { id: 'ue-vapid-buggy-03', label: 'Cockpit' },
    ],
  },
  {
    id: 'one-eyed-willie',
    name: 'One-Eyed Willie',
    sub: 'Off-road truck',
    pack: 'Ultimate Edition',
    note: 'A green off-roader in full livery.',
    shots: [
      { id: 'ue-one-eyed-willie-01', label: 'Studio', paint: true, focus: [0.5, 0.55, 1.08] },
      { id: 'ue-one-eyed-willie-02', label: 'Grille' },
      { id: 'ue-one-eyed-willie-03', label: 'In the shop', focus: [0.5, 0.6, 1.1] },
    ],
  },
  {
    id: 'rideout',
    name: 'Rideout Customs',
    sub: 'Lowrider builds',
    pack: 'Ultimate Edition',
    note: 'Gold flake, spoke wheels and a shop that never closes.',
    shots: [
      { id: 'ue-rideout-customs-03', label: 'On the lift', paint: true, focus: [0.42, 0.65, 1.3] },
      { id: 'ue-rideout-customs-01', label: 'Gold flake' },
      { id: 'ue-rideout-customs-02', label: 'Interior' },
    ],
  },
  {
    id: 'wyman',
    name: 'Wyman Car Collection',
    sub: 'Six classics, one yard',
    pack: 'Ultimate Edition',
    note: 'A yard full of classics: muscle, racers and a woody wagon.',
    shots: [
      { id: 'ue-wyman-car-collection-02', label: 'Muscle coupe', paint: true },
      { id: 'ue-wyman-car-collection-04', label: 'Number 36', paint: true },
      { id: 'ue-wyman-car-collection-05', label: 'Wire wheels', paint: true },
      { id: 'ue-wyman-car-collection-06', label: 'Stars and stripes', paint: true },
      { id: 'ue-wyman-car-collection-03', label: 'Wagon' },
      { id: 'ue-wyman-car-collection-01', label: 'The yard', focus: [0.35, 0.45, 1.1] },
    ],
  },
  {
    id: 'squalo',
    name: 'Squalo',
    sub: 'Speedboat',
    pack: 'Ultimate Edition',
    note: 'A white speedboat for Biscayne-blue water and skyline runs.',
    shots: [
      { id: 'ue-squalo-01', label: 'Skyline run', paint: true, focus: [0.5, 0.72, 1.45] },
      { id: 'ue-squalo-04', label: 'From above' },
      { id: 'ue-squalo-03', label: 'On deck' },
      { id: 'ue-squalo-02', label: 'Hull' },
    ],
  },
  {
    id: 'safehouse',
    name: 'Safehouse Rides',
    sub: 'Muscle car, dirt bike, kayak',
    pack: 'Ultimate Edition',
    note: 'Everything parked at the stilt house in the Keys.',
    shots: [
      { id: 'ue-safehouse-vehicles-01', label: 'Stilt house', focus: [0.35, 0.65, 1.2] },
      { id: 'ue-safehouse-vehicles-02', label: 'Dirt bike' },
      { id: 'ue-safehouse-vehicles-03', label: 'Kayak' },
    ],
  },
]

export const PAINTS: { id: string; name: string; hex: string }[] = [
  { id: 'vice-pink', name: 'Vice Pink', hex: '#ff4fa3' },
  { id: 'sunset', name: 'Sunset Orange', hex: '#ff6a2a' },
  { id: 'gold', name: 'Gold Rush', hex: '#ffbf3a' },
  { id: 'lime', name: 'Lime Fizz', hex: '#9dff3a' },
  { id: 'teal', name: 'Ocean Teal', hex: '#12c9bb' },
  { id: 'miami', name: 'Biscayne Blue', hex: '#2a8cff' },
  { id: 'midnight', name: 'Midnight', hex: '#1d2c78' },
  { id: 'grape', name: 'Grape Soda', hex: '#7a2be0' },
  { id: 'cherry', name: 'Cherry', hex: '#d3123a' },
  { id: 'pearl', name: 'Pearl', hex: '#f4efe6' },
  { id: 'black', name: 'Gloss Black', hex: '#141414' },
]

export const TABS = [
  { id: 'wardrobe', label: 'Wardrobe', list: wardrobe },
  { id: 'weapons', label: 'Weapons', list: weapons },
  { id: 'garage', label: 'Garage', list: garage },
] as const
export type TabId = (typeof TABS)[number]['id']

export const gearById = Object.fromEntries([...wardrobe, ...weapons, ...garage].map((g) => [g.id, g])) as Record<string, GearItem>
