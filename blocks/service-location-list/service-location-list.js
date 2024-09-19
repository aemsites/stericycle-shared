import { decorateIcons, getMetadata } from '../../scripts/aem.js';
import ffetch from '../../scripts/ffetch.js';

async function fetchLocations() {
  const isDropoff = Boolean(getMetadata('is-drop-off'));
  const rawData = await ffetch('/query-index.json')
    .sheet('locations')
    .filter((x) => (isDropoff ? x['sub-type']?.trim().toLowerCase() === 'drop-off' : true))
    .all();

  // group by region and sort regions
  const regionMap = new Map();
  rawData.forEach((entry) => {
    let locations = [];
    const region = entry.state === '0' ? '' : entry.state || '';
    if (regionMap.has(region)) {
      locations = regionMap.get(region);
    }

    locations.push({ path: entry.path, name: entry.name || entry.city || 'unnamed' });

    regionMap.set(region, locations);
  });

  return new Map([...regionMap.entries()].sort());
}

export default function decorate(block) {
  fetchLocations().then((regionMap) => {
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
        const url = new URL(window.location.href);
        url.pathname = location.path;
        locationLink.href = url.href;
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
  });
}
