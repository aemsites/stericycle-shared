import { decorateIcons } from '../../scripts/aem.js';

function fetchLocations() {
  // TODO: Add caching

  // TODO: replace mock with spreadsheet data
  const data = [
    // { slug: '', name: '', region: '' },
    { slug: 'birmingham-usa', name: 'Birmingham (USA)', region: 'Alabama' },
    { slug: 'mobile', name: 'Mobile', region: 'Alabama' },
    { slug: 'huntsville', name: 'Huntsville', region: 'Alabama' },
    { slug: 'montgomery', name: 'Montgomery', region: 'Alabama' },
    { slug: 'los-angeles', name: 'Los Angeles', region: 'California' },
    { slug: 'concord', name: 'Concord', region: 'California' },
    { slug: 'san-bernardino', name: 'San Bernardino', region: 'California' },
    { slug: 'san-francisco', name: 'San Francisco', region: 'California' },
    { slug: 'fresno', name: 'Fresno', region: 'California' },
    { slug: 'phoenix', name: 'Phoenix', region: 'Arizona' },
    { slug: 'greensboro', name: 'Greensboro' },
  ];

  // group by region and sort regions
  const regionMap = new Map();
  data.forEach((entry) => {
    let locations = [];
    const region = entry.region || '';
    if (regionMap.has(region)) {
      locations = regionMap.get(region);
    }

    locations.push({ slug: entry.slug, name: entry.name });

    regionMap.set(region, locations);
  });

  return new Map([...regionMap.entries()].sort());
}

export default function decorate(block) {
  const indexUrl = window.location.href.endsWith('/') ? window.location : `${window.window}/`;
  const regionMap = fetchLocations();

  regionMap.forEach((locations, region) => {
    const state = document.createElement('div');
    state.classList.add('state');

    if (region !== '') {
      const stateHeading = document.createElement('H3');
      stateHeading.innerText = region;
      state.append(stateHeading);
    }

    const locationList = document.createElement('ol');
    locationList.classList.add('location-list');
    locations.forEach((location) => {
      const locationCard = document.createElement('li');
      const locationLink = document.createElement('a');
      locationLink.innerText = location.name;
      locationLink.href = `${indexUrl + location.slug}/`;
      const icon = document.createElement('span');
      icon.classList.add('icon', 'icon-circle-chevron-right');
      locationLink.append(icon);
      decorateIcons(locationLink);
      locationCard.append(locationLink);
      locationList.append(locationCard);
    });
    state.append(locationList);

    block.append(state);
  });
}
