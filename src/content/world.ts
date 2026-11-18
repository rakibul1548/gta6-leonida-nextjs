export type RegionId = 'vice-city' | 'leonida-keys' | 'grassrivers' | 'port-gellhorn' | 'ambrosia' | 'mount-kalaga-national-park'
export type Particle = 'bokeh' | 'spray' | 'fireflies' | 'fog' | 'embers' | 'dust'

export type Region = {
  id: RegionId
  name: string
  short: string
  line: string
  postcard: string
  shots: string
  sky: [string, string, string]
  ground: string
  particle: Particle
  tint: [string, string]
}

export const regions: Region[] = [
  {
    id: 'vice-city',
    name: 'Vice City',
    short: 'Vice City',
    line: 'Towers, neon and a beach that never empties. Everything in Leonida runs through here eventually.',
    postcard: 'postcard-vice-city',
    shots: 'vice-city',
    sky: ['#14072e', '#7b2a8f', '#ff5fa8'],
    ground: '#1a0826',
    particle: 'bokeh',
    tint: ['#ff4fa3', '#19d3c5'],
  },
  {
    id: 'leonida-keys',
    name: 'Leonida Keys',
    short: 'The Keys',
    line: 'Islands strung together by long bridges, clear water on both sides and boats that keep odd hours.',
    postcard: 'postcard-leonida-keys',
    shots: 'leonida-keys',
    sky: ['#1b4f8f', '#58a9d9', '#c9f1ff'],
    ground: '#0b3442',
    particle: 'spray',
    tint: ['#ffffff', '#9fe3ff'],
  },
  {
    id: 'grassrivers',
    name: 'Grassrivers',
    short: 'Grassrivers',
    line: 'Endless wetland. Tall grass, still water and sunsets that take their time.',
    postcard: 'postcard-grassrivers',
    shots: 'grassrivers',
    sky: ['#2a1238', '#a3422e', '#ffa04a'],
    ground: '#17200f',
    particle: 'fireflies',
    tint: ['#e8ff7a', '#ffd34a'],
  },
  {
    id: 'port-gellhorn',
    name: 'Port Gellhorn',
    short: 'Port Gellhorn',
    line: 'A beach town after dark. Its postcard is a night shot, and that says plenty.',
    postcard: 'postcard-port-gellhorn',
    shots: 'port-gellhorn',
    sky: ['#070b1e', '#1e2c55', '#5a6f9f'],
    ground: '#0b0f1e',
    particle: 'fog',
    tint: ['#9fb4e8', '#ffc857'],
  },
  {
    id: 'ambrosia',
    name: 'Ambrosia',
    short: 'Ambrosia',
    line: 'Smokestacks over flat country, lit orange at dusk. A working town with its own rules.',
    postcard: 'postcard-ambrosia',
    shots: 'ambrosia',
    sky: ['#1e0a0c', '#7a2416', '#ff7a3c'],
    ground: '#1d0f0a',
    particle: 'embers',
    tint: ['#ff7a3c', '#ffc857'],
  },
  {
    id: 'mount-kalaga-national-park',
    name: 'Mount Kalaga',
    short: 'Mount Kalaga',
    line: 'Forest, river and falling light. The wild corner of the state, a long way from the neon.',
    postcard: 'postcard-mount-kalaga-national-park',
    shots: 'mount-kalaga-national-park',
    sky: ['#173a33', '#5d8f5a', '#ffe3a3'],
    ground: '#101e10',
    particle: 'dust',
    tint: ['#ffe3a3', '#c9ff9a'],
  },
]

export const regionById = Object.fromEntries(regions.map((r) => [r.id, r])) as Record<RegionId, Region>

export function routeFor(lead: 'jason' | 'lucia' | null): Region[] {
  const order: RegionId[] =
    lead === 'jason'
      ? ['leonida-keys', 'vice-city', 'grassrivers', 'port-gellhorn', 'ambrosia', 'mount-kalaga-national-park']
      : ['vice-city', 'leonida-keys', 'grassrivers', 'port-gellhorn', 'ambrosia', 'mount-kalaga-national-park']
  return order.map((id) => regionById[id])
}

export type Video = {
  id: string
  title: string
  length: string
  embed: boolean
  chips?: { t: number; label: string }[]
}

export const videos: Video[] = [
  {
    id: 'rz1B4B2yBZY',
    title: 'Launch Trailer',
    length: '1:30',
    embed: true,
    chips: [
      { t: 3, label: 'The Keys' },
      { t: 17, label: 'Vice City nights' },
      { t: 26, label: 'On the road' },
      { t: 55, label: 'Beach day' },
      { t: 72, label: 'Shots fired' },
    ],
  },
  {
    id: 'VQRLujxTm3c',
    title: 'Trailer 2',
    length: '2:47',
    embed: true,
    chips: [
      { t: 8, label: 'Keys from above' },
      { t: 36, label: 'Into Vice City' },
      { t: 50, label: 'The penitentiary' },
      { t: 100, label: 'Club night' },
      { t: 140, label: 'On the water' },
    ],
  },
  {
    id: 'QdBZY2fkU-0',
    title: 'Trailer 1',
    length: '1:30',
    embed: true,
    chips: [
      { t: 3, label: 'Sunset skyline' },
      { t: 13, label: 'Vice Beach' },
      { t: 20, label: 'Flamingos' },
      { t: 40, label: 'VICE' },
      { t: 69, label: 'The job' },
    ],
  },
  { id: '_yl5ELcmugI', title: 'Pre-Load Now', length: '0:30', embed: true },
  { id: 'EiQEBYDox_k', title: 'Cover Art Reveal', length: '0:33', embed: true },
  { id: 'qq76pQsI1iw', title: 'Gameplay teaser', length: '0:25', embed: true },
  { id: 'tJbzMqJGH4k', title: 'An Extended Look', length: '26:48', embed: false },
]

export const ytThumb = (id: string, hq = true) => `https://i.ytimg.com/vi/${id}/${hq ? 'maxresdefault' : 'hqdefault'}.jpg`
export const ytWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`

export type Saga = { id: string; year: number; title: string; short: string; place: string; numeral: string; colors: [string, string, string] }

export const saga: Saga[] = [
  { id: 'gta', year: 1997, title: 'Grand Theft Auto', short: 'the original', place: 'Liberty City · Vice City · San Andreas', numeral: 'I', colors: ['#0e2a12', '#2f7d32', '#d7ff6b'] },
  { id: 'gta2', year: 1999, title: 'Grand Theft Auto 2', short: 'GTA 2', place: 'Anywhere City', numeral: 'II', colors: ['#14141c', '#3a3a52', '#f2d34b'] },
  { id: 'gta3', year: 2001, title: 'Grand Theft Auto III', short: 'GTA III', place: 'Liberty City', numeral: 'III', colors: ['#121212', '#3c3c3c', '#f0f0f0'] },
  { id: 'vc', year: 2002, title: 'Grand Theft Auto: Vice City', short: 'Vice City', place: 'Vice City, 1986', numeral: 'VC', colors: ['#2b0d3a', '#e93a9a', '#3fe0ff'] },
  { id: 'sa', year: 2004, title: 'Grand Theft Auto: San Andreas', short: 'San Andreas', place: 'Los Santos · San Fierro · Las Venturas', numeral: 'SA', colors: ['#1a1408', '#c27a1e', '#ffd36b'] },
  { id: 'gta4', year: 2008, title: 'Grand Theft Auto IV', short: 'GTA IV', place: 'Liberty City', numeral: 'IV', colors: ['#0f1418', '#4d5d68', '#d6c7a1'] },
  { id: 'gta5', year: 2013, title: 'Grand Theft Auto V', short: 'GTA V', place: 'Los Santos · Blaine County', numeral: 'V', colors: ['#0d1d12', '#2f8f4e', '#ffe08a'] },
  { id: 'gta6', year: 2026, title: 'Grand Theft Auto VI', short: 'GTA VI', place: 'Vice City · Leonida', numeral: 'VI', colors: ['#2a0b47', '#e93a9a', '#ffc857'] },
]

export type ChapterId = 'hero' | 'wait' | 'saga' | 'story' | 'lead' | 'loadout' | 'leonida' | 'gameplay' | 'drivein' | 'cover' | 'launch' | 'passed'

export const chapters: { id: ChapterId; n: string; name: string; nav?: string; art: string; prompts: [string, string][]; touch?: string }[] = [
  { id: 'hero', n: '01', name: 'Vice City, USA', art: 'jason-and-lucia-01', prompts: [['Mouse', 'Look'], ['Drag', 'Time of day']], touch: 'Drag the sun to change the time' },
  { id: 'wait', n: '02', name: 'The Wait', art: 'jason-and-lucia-motel', prompts: [['Scroll', 'Speed']], touch: 'Scroll fast and the words speed up' },
  { id: 'saga', n: '03', name: 'The Road to VI', art: 'official-cover-art', prompts: [['◀ ▶', 'Browse'], ['Enter', 'Pick']], touch: 'Swipe the covers, tap to pick' },
  { id: 'story', n: '04', name: 'The Story', nav: 'Story', art: 'jason-and-lucia-beach', prompts: [['Drag', 'Split screen']], touch: 'Drag the handle between them' },
  { id: 'lead', n: '05', name: 'Choose Your Lead', nav: 'Cast', art: 'jason-and-lucia-lock-and-load', prompts: [['◀ ▶', 'Move'], ['Enter', 'Select']], touch: 'Swipe through the cast' },
  { id: 'loadout', n: '06', name: 'Loadout', nav: 'Garage', art: 'jason-and-lucia-robbery', prompts: [['↑ ↓', 'Pick'], ['Drag', 'Turn'], ['Click', 'Respray']], touch: 'Swipe the picture to turn it' },
  { id: 'leonida', n: '07', name: 'Only in Leonida', nav: 'Leonida', art: 'postcard-leonida-keys', prompts: [['W S', 'Move'], ['Mouse', 'Look'], ['E', 'Next stop']], touch: 'Scroll to drive · tap a photo' },
  { id: 'gameplay', n: '08', name: 'Gameplay', nav: 'Gameplay', art: 'postcard-vice-city', prompts: [['Drag', 'Film strips']], touch: 'Drag the film strips' },
  { id: 'drivein', n: '09', name: 'The Drive-In', nav: 'Videos', art: 'jason-and-lucia-rooftop', prompts: [['Click', 'Play']], touch: 'Tap a trailer to play' },
  { id: 'cover', n: '10', name: 'The Cover', art: 'official-cover-art', prompts: [['Click', 'Open panel']], touch: 'Tap the cover for the gallery' },
  { id: 'launch', n: '11', name: 'Launch', nav: 'Launch', art: 'jason-and-lucia-02', prompts: [['Mouse', 'Tilt the cover']], touch: 'Tap through to Rockstar' },
  { id: 'passed', n: '12', name: 'Mission Passed', art: 'jason-and-lucia-01', prompts: [['Click', 'Share your card']], touch: 'Share your card' },
]

export const SECRETS: { id: string; name: string; hint: string }[] = [
  { id: 'cheat', name: 'Old habits', hint: 'Type a cheat code anywhere.' },
  { id: 'flamingo', name: 'Pink visitor', hint: 'Something pink is hiding in the opening scene.' },
  { id: 'midnight', name: 'Midnight', hint: 'Turn the clock all the way.' },
  { id: 'lookup', name: 'Look up', hint: 'At the last stop of the road trip, look to the sky.' },
  { id: 'trailer', name: 'Roll credits', hint: 'Watch a trailer to the very end.' },
  { id: 'card', name: 'Proof', hint: 'Make a card or a cover of your own.' },
]

export const GTAV_RELEASE = new Date(2013, 8, 17, 0, 0, 0)
export const LAUNCH = new Date(2026, 10, 19, 0, 0, 0)
export const DAY = 86400000

export const daysSinceV = (now = Date.now()) => Math.floor((now - GTAV_RELEASE.getTime()) / DAY)
export const LAUNCH_WAIT_DAYS = Math.round((LAUNCH.getTime() - GTAV_RELEASE.getTime()) / DAY)

export const OFFICIAL = 'https://www.rockstargames.com/VI'
