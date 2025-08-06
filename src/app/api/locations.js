// Australian surf spots - using Surfline's exact coordinates
export const SURF_SPOTS = [
  // NSW - Byron Bay Area (Surfline exact coordinates)
  {
    id: 'the-pass',
    name: 'The Pass',
    region: 'Byron Bay, NSW',
    lat: -28.63764444,
    lng: 153.62803,
    description: 'World-class right-hand point break'
  },
  {
    id: 'main-beach-byron',
    name: 'Main Beach',
    region: 'Byron Bay, NSW',
    lat: -28.641084351545537, 
    lng: 153.61461,
    description: 'Consistent beach break in town'
  },
  {
    id: 'lennox-point',
    name: 'Lennox Point',
    region: 'Lennox Head, NSW',
    lat: -28.793,
    lng: 153.587,
    description: 'Powerful right-hand point break'
  },
  
  // NSW - Sydney Area (Surfline coordinates where available)
  {
    id: 'manly',
    name: 'Manly',
    region: 'Sydney Northern Beaches, NSW',
    lat: -33.796160769442245,
    lng: 151.2884,
    description: 'Consistent beach break, good for all levels'
  },
  {
    id: 'bondi',
    name: 'Bondi',
    region: 'Sydney Eastern Beaches, NSW',
    lat: -33.890,
    lng: 151.274,
    description: 'World-famous beach break'
  },
  {
    id: 'coogee',
    name: 'Coogee',
    region: 'Sydney Eastern Beaches, NSW',
    lat: -33.921,
    lng: 151.258,
    description: 'Protected bay, good for beginners'
  },
  {
    id: 'cronulla',
    name: 'Cronulla',
    region: 'Sydney South, NSW',
    lat: -34.028,
    lng: 151.154,
    description: 'Consistent surf, multiple breaks'
  },
  
  // QLD - Sunshine Coast (Surfline coordinates)
  {
    id: 'peregian',
    name: 'Peregian',
    region: 'Sunshine Coast, QLD',
    lat: -26.480171870235186,
    lng: 153.0989,
    description: 'Quality beach break with good access'
  },
  {
    id: 'noosa-first-point',
    name: 'Noosa First Point',
    region: 'Sunshine Coast, QLD',
    lat: -26.384,
    lng: 153.092,
    description: 'World-class right-hand point break'
  },
  
  // QLD - Gold Coast
  {
    id: 'snapper-rocks',
    name: 'Snapper Rocks',
    region: 'Gold Coast, QLD',
    lat: -28.174,
    lng: 153.543,
    description: 'Famous point break, can get very crowded'
  },
  {
    id: 'superbank',
    name: 'Superbank',
    region: 'Gold Coast, QLD',
    lat: -28.162,
    lng: 153.536,
    description: 'World-class artificial sand point'
  },
  {
    id: 'burleigh-heads',
    name: 'Burleigh Heads',
    region: 'Gold Coast, QLD',
    lat: -28.089,
    lng: 153.451,
    description: 'Consistent right-hand point break'
  },
  {
    id: 'kirra',
    name: 'Kirra',
    region: 'Gold Coast, QLD',
    lat: -28.163,
    lng: 153.535,
    description: 'Barrel paradise when it works'
  },
  
  // VIC - Surf Coast (Surfline coordinates where available)
  {
    id: 'torquay-surf-beach',
    name: 'Torquay Surf Beach',
    region: 'Surf Coast, VIC',
    lat: -38.34494,
    lng: 144.31937,
    description: 'Consistent beach break in surf town'
  },
  {
    id: 'bells-beach',
    name: 'Bells Beach',
    region: 'Surf Coast, VIC',
    lat: -38.373,
    lng: 144.279,
    description: 'Legendary point break, Rip Curl Pro venue'
  },
  
  // WA - Perth Area (Surfline coordinates)
  {
    id: 'cottesloe',
    name: 'Cottesloe',
    region: 'Perth, WA',
    lat: -32.007275,
    lng: 115.75131,
    description: 'Popular city beach break'
  },
  {
    id: 'margaret-river-main',
    name: 'Margaret River Main Break',
    region: 'Margaret River, WA',
    lat: -33.955,
    lng: 115.072,
    description: 'Powerful left-hand point break'
  }
]

// Helper functions
export function getAllSpots() {
  return SURF_SPOTS
}

export function getSpotsByRegion(region) {
  return SURF_SPOTS.filter(spot => spot.region.includes(region))
}

export function findSpotById(id) {
  return SURF_SPOTS.find(spot => spot.id === id)
}

export function findSpotByName(name) {
  return SURF_SPOTS.find(spot => 
    spot.name.toLowerCase().includes(name.toLowerCase())
  )
}

// Get spots by state
export function getSpotsByState(state) {
  return SURF_SPOTS.filter(spot => spot.region.includes(state))
}