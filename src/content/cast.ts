export type CastId = 'cal-hampton' | 'boobie-ike' | 'jason-duval' | 'lucia-caminos' | 'drequan-priest' | 'real-dimez' | 'raul-bautista' | 'brian-heder'

export type Cast = {
  id: CastId
  first: string
  last: string
  role: string
  traits: [string, string, string]
  bio: [string, string]
  art: string
  clip: string
  shots: string
  lead?: 'jason' | 'lucia'
  color: string
}

export const cast: Cast[] = [
  {
    id: 'cal-hampton',
    first: 'Cal',
    last: 'Hampton',
    role: "Jason's buddy. Professional paranoid.",
    traits: ['Homebody', 'Radio scanner', 'Trusts no one'],
    bio: [
      'Known for: Coast Guard radio on, curtains shut, a theory for everything.',
      'Works with: Jason, through Brian. Would rather stay on the couch.',
    ],
    art: 'cal-hampton',
    clip: 'cal-hampton',
    shots: 'cal-hampton',
    color: '#7fd1c7',
  },
  {
    id: 'boobie-ike',
    first: 'Boobie',
    last: 'Ike',
    role: 'Vice City legend with a real empire.',
    traits: ['Mogul', 'Showman', 'Business first'],
    bio: [
      'Known for: turning street money into a club, a studio and property.',
      'Current bet: Only Raw Records, with Dre’Quan.',
    ],
    art: 'boobie-ike',
    clip: 'boobie-ike',
    shots: 'boobie-ike',
    color: '#ffc857',
  },
  {
    id: 'jason-duval',
    first: 'Jason',
    last: 'Duval',
    role: 'Ex-Army. Works for runners in the Keys.',
    traits: ['Ex-Army', 'Keys local', 'Wants out'],
    bio: [
      'Known for: a short Army career and a long list of side jobs in the Keys.',
      'Wants: something easier. Gets: Lucia.',
    ],
    art: 'jason-and-lucia-lock-and-load',
    clip: 'jason-duval',
    shots: 'jason-duval',
    lead: 'jason',
    color: '#19d3c5',
  },
  {
    id: 'lucia-caminos',
    first: 'Lucia',
    last: 'Caminos',
    role: 'Fresh out of Leonida Penitentiary.',
    traits: ['Fighter', 'Planner', 'Family first'],
    bio: [
      'Known for: time in Leonida Penitentiary, served for her family.',
      'Rule since release: think first, then move.',
    ],
    art: 'jason-and-lucia-beach',
    clip: 'lucia-caminos',
    shots: 'lucia-caminos',
    lead: 'lucia',
    color: '#ff4fa3',
  },
  {
    id: 'drequan-priest',
    first: 'Dre’Quan',
    last: 'Priest',
    role: 'Hustler turned label boss.',
    traits: ['Only Raw Records', 'Hustler', 'Ambitious'],
    bio: [
      'Known for: running Only Raw Records, the label behind Real Dimez.',
      'Ambition: much bigger than one club stage.',
    ],
    art: 'drequan-priest',
    clip: 'drequan-priest',
    shots: 'drequan-priest',
    color: '#ff7a3c',
  },
  {
    id: 'real-dimez',
    first: 'Real',
    last: 'Dimez',
    role: 'Bae-Luxe and Roxy. Viral hooks.',
    traits: ['Duo', 'Viral', 'Signed'],
    bio: [
      'Known for: Bae-Luxe and Roxy, school friends turned rap duo with a loud feed.',
      'Status: signed to Only Raw, hunting a second hit.',
    ],
    art: 'real-dimez',
    clip: 'real-dimez',
    shots: 'real-dimez',
    color: '#c58bff',
  },
  {
    id: 'raul-bautista',
    first: 'Raul',
    last: 'Bautista',
    role: 'Veteran bank robber, always recruiting.',
    traits: ['Professional', 'Charmer', 'Reckless'],
    bio: [
      'Known for: bank jobs, and recruiting the people who pull them.',
      'Risk level: rising with every plan.',
    ],
    art: 'raul-bautista',
    clip: 'raul-bautista',
    shots: 'raul-bautista',
    color: '#e8e2d6',
  },
  {
    id: 'brian-heder',
    first: 'Brian',
    last: 'Heder',
    role: 'Old-school smuggler with a boat yard.',
    traits: ['Smuggler', 'Boat yard', "Jason's landlord"],
    bio: [
      'Known for: decades of smuggling through the Keys from his boat yard.',
      'Arrangement: Jason lives rent-free. The rent is favours.',
    ],
    art: 'brian-heder',
    clip: 'brian-heder',
    shots: 'brian-heder',
    color: '#ff9bd2',
  },
]

export const castById = Object.fromEntries(cast.map((c) => [c.id, c])) as Record<CastId, Cast>
