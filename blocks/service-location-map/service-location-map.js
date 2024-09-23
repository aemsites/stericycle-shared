/* global mapboxgl */

import {
  a,
  div,
  p,
  span,
  input,
  button,
} from '../../scripts/dom-helpers.js';
import {
  decorateIcons,
  loadScript,
  loadCSS,
  fetchPlaceholders,
  getMetadata,
} from '../../scripts/aem.js';
import ffetch from '../../scripts/ffetch.js';
import usStates from './us-states.js';
import { decorateAnchors, getLocale } from '../../scripts/scripts.js';

let map = null;

const getAccessToken = () => 'pk.eyJ1Ijoic3RlcmljeWNsZSIsImEiOiJjbDNhZ3M5b3AwMWphM2RydWJobjY3ZmxmIn0.xt2cRdtjXnnZXXXLt3bOlQ';

const toRadians = (degrees) => ((degrees * Math.PI) / 180);

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const tempA = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
    * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(tempA), Math.sqrt(1 - tempA));
  return Math.round(R * c); // Distance in kilometers
};

const locDivCreation = (location, ph) => {
  const locationDiv = div(
    { class: 'location-item', id: `location-${location.index}`, name: location.name },
  );

  if (location.title) {
    locationDiv.appendChild(p({ class: 'title' }, location.title));
  }

  if (location['address-line-1'] && location['address-line-1'] !== '0') {
    locationDiv.appendChild(
      p({ class: 'address' }, location['address-line-1']),
    );
  }

  if (location['address-line-2'] && location['address-line-2'] !== '0') {
    locationDiv.appendChild(
      p({ class: 'address' }, location['address-line-2']),
    );
  }

  if (location['address-line-3'] && location['address-line-3'] !== '0') {
    locationDiv.appendChild(
      p({ class: 'address' }, location['address-line-3']),
    );
  }

  locationDiv.appendChild(
    p({ class: 'distance' }, `${location.distance} km`),
  );

  if (location['opening-hours']) {
    const tempP = p({ class: 'opening-hours' });
    tempP.innerHTML = location['opening-hours'];
    locationDiv.appendChild(tempP);
  }

  if (location['gmap-link']) {
    locationDiv.appendChild(
      p(
        { class: 'gmap' },
        a({ href: location['gmap-link'] }, 'Get Directions'),
      ),
    );
  }

  if (location['appointment-date-time']) {
    locationDiv.appendChild(
      p({ class: 'appointment-detail' }, location['appointment-date-time']),
    );
  }

  if (location['appointment-policy']) {
    locationDiv.appendChild(
      p({ class: 'appointment-detail' }, location['appointment-policy']),
    );
  }

  if (location['drop-off-info']) {
    locationDiv.appendChild(
      p({ class: 'appointment-detail' }, location['drop-off-info']),
    );
  }

  if (location['location-link'] && location.title && location.path) {
    locationDiv.appendChild(
      a(
        { class: 'location', href: location.path },
        location['location-link'],
      ),
    );
  }

  if (location['buy-now']) {
    locationDiv.appendChild(
      a(
        { class: 'buy-now', href: location['buy-now'] },
        ph.buynowtext,
      ),
    );
  }

  return locationDiv;
};

const calculateLocationListDistance = (locations, centerPoint) => {
  locations.forEach((location) => {
    location.distance = haversineDistance(
      location.lat,
      location.lng,
      centerPoint.latitude,
      centerPoint.longitude,
    );
  });
};

async function fetchLocations(isDropoff, ph) {
  return (await ffetch('/query-index.json').sheet('locations')
    .filter((x) => (x.latitude !== '0' && x.longitude !== '0')
      && (isDropoff ? x['sub-type']?.trim().toLowerCase() === 'drop-off' : true)
      && (x.locale?.trim().toLowerCase() === getLocale()))
    .map((x) => {
      const getValueOrNull = (value) => (value == null || value === 0 || value === '0' ? null : value);
      const mp = {
        lat: x.latitude,
        lng: x.longitude,
        'zip-code': getValueOrNull(x['zip-code']),
        city: getValueOrNull(x.city),
        state: getValueOrNull(x.state),
        country: getValueOrNull(x.country),
        name: getValueOrNull(x.name),
        'additional-cities': getValueOrNull(x['additional-cities']),
        'sub-type': getValueOrNull(x['sub-type']),
        path: getValueOrNull(x.path),
      };

      if (isDropoff) {
        mp.title = getValueOrNull(x['address-line-1']);
        mp['address-line-1'] = getValueOrNull(x['address-line-2']);
        mp['address-line-2'] = [mp.city, usStates[mp.state], mp['zip-code']].filter(Boolean).join(', ');
        mp['gmap-link'] = `https://www.google.com/maps/dir/${[mp.title, mp['address-line-1'], mp['address-line-2']].filter(Boolean).join(', ')}`;
        mp['buy-now'] = mp['zip-code']
          ? `https://shop-shredit.stericycle.com/commerce_storefront_ui/walkin.aspx?zip=${mp['zip-code']}`
          : 'https://shop-shredit.stericycle.com/commerce_storefront_ui/walkin.aspx';
        mp['opening-hours'] = getValueOrNull(x['opening-hours']);
        mp['appointment-date-time'] = getValueOrNull(x['appointment-date-time']);
        mp['appointment-policy'] = getValueOrNull(x['appointment-policy']);
        mp['drop-off-info'] = getValueOrNull(x['drop-off-info']);
      } else {
        mp.title = `Shred-it ${mp.name || mp.city}`;
        mp['address-line-1'] = x['address-line-1'] || '';
        mp['address-line-2'] = x['address-line-2'] || '';
        mp['address-line-3'] = [mp.city, usStates[mp.state], mp['zip-code']].filter(Boolean).join(', ');
        mp['location-link'] = `${ph.gototext} ${mp.title}`;
      }
      mp['state-code'] = usStates[mp.state];
      return mp;
    })
    .all())
    .map((x, index) => {
      x.index = index;
      return x;
    });
}

/**
 * Method to apply markers on the map
 * @param {*} locations
 */
function applyMarkers(locations) {
  locations.forEach((location) => {
    const el = div({ class: 'marker' }, span({ class: 'icon icon-marker', id: `marker-${location.index}`, title: location.title }));

    el.addEventListener('click', () => {
      const spanEl = el.querySelector('span');
      spanEl.innerHTML = '';
      if (spanEl.classList.contains('icon-marker')) {
        document.querySelectorAll('.icon-marker-bold').forEach((marker) => {
          marker.classList.remove('icon-marker-bold');
          marker.classList.add('icon-marker');

          const id = marker.id.split('-')[1];
          const targetDiv = document.getElementById(`location-${id}`);
          if (targetDiv) {
            targetDiv.classList.remove('highlight');
          }
          marker.innerHTML = '';
          decorateIcons(marker.parentElement);
        });

        spanEl.classList.remove('icon-marker');
        spanEl.classList.add('icon-marker-bold');

        const id = spanEl.id.split('-')[1];

        const mapList = document.querySelector('.block.service-location-map .map-list');
        const targetDiv = document.getElementById(`location-${id}`);

        if (targetDiv && mapList) {
          mapList.scrollTop = targetDiv.offsetTop - mapList.offsetTop;
          targetDiv.classList.add('highlight');
        }
      } else {
        spanEl.classList.remove('icon-marker-bold');
        spanEl.classList.add('icon-marker');

        const id = spanEl.id.split('-')[1];
        const targetDiv = document.getElementById(`location-${id}`);
        if (targetDiv) {
          targetDiv.classList.remove('highlight');
        }
      }

      decorateIcons(el);
    });
    decorateIcons(el);
    new mapboxgl.Marker(el)
      .setLngLat([location.lng, location.lat])
      .addTo(map);
  });
}

const getCountry = () => {
  const locale = getLocale();
  return locale.split('-')[1].trim().toLowerCase();
};

const getContactUshref = (ph) => `/${getLocale()}/${ph.contactuslinktext}`;

/**
 * Renders the location list
 * @param {*} locations
 * @param {*} block
 */
const renderLocationList = (locations, block, ph) => {
  const locationContainer = block.querySelector('.map-list');
  locationContainer.innerHTML = '';

  if (locations.length === 0) {
    const tempP = p({ class: 'no-result' }, span({}, `${ph.servicemapcurrentlocationnoresulttextpre} `));
    tempP.appendChild(a({ href: getContactUshref(ph) }, ph.contactustext));
    tempP.appendChild(span({}, ` ${ph.servicemapcurrentlocationnoresulttextpost}`));
    locationContainer.appendChild(tempP);
    locationContainer.classList.add('no-result');
  } else {
    locationContainer.classList.remove('no-result');
    locations.forEach((location) => {
      locationContainer.appendChild(locDivCreation(location, ph));
    });
  }
};

/**
 * Sorts the location list based on city, state, country and distance
 * @param {*} locations
 * @returns
 */
const sortLocationList = (locations) => locations
  .sort((x, y) => x.city && y.city && x.city.localeCompare(y.city))
  .sort((x, y) => x.state && y.state && x.state.localeCompare(y.state))
  .sort((x, y) => x.country && y.country && x.country.localeCompare(y.country))
  .sort((x, y) => x.distance - y.distance);

const renderAndSortLocationList = (locations, block, ph) => {
  sortLocationList(locations);
  renderLocationList(locations, block, ph);
};

/**
 * Renders the initial markers on the map
 * @returns
 */
const getCenterPoint = () => {
  const country = getCountry();

  const countryCoordinates = {
    gb: { latitude: 55, longitude: -3, zoom: 3 },
    de: { latitude: 51, longitude: 10, zoom: 3 },
    au: { latitude: -26, longitude: 133, zoom: 3 },
    ie: { latitude: 53, longitude: -7, zoom: 3 },
    sg: { latitude: 1, longitude: 103, zoom: 3 },
    ae: { latitude: 25, longitude: 55, zoom: 3 },
    nl: { latitude: 52, longitude: 4, zoom: 3 },
    pt: { latitude: 38, longitude: -9, zoom: 3 },
    fr: { latitude: 48, longitude: 2, zoom: 3 },
    be: { latitude: 50, longitude: 4, zoom: 3 },
    es: { latitude: 40, longitude: -3, zoom: 3 },
    lu: { latitude: 49, longitude: 6, zoom: 3 },
    default: { latitude: 40, longitude: -96, zoom: 3 },
  };

  if (countryCoordinates[country]) {
    return countryCoordinates[country];
  }
  return countryCoordinates.default;
};

const dragAndZoom = (locations, block, ph) => {
  const bounds = map?.getBounds();

  const tempLocations = locations
    .filter((location) => bounds?.contains([location.lng, location.lat]))
    .map((location) => {
      location.distance = haversineDistance(
        location.lat,
        location.lng,
        map?.getCenter().lat,
        map?.getCenter().lng,
      );
      return location;
    });

  renderAndSortLocationList(tempLocations, block, ph);
};

/**
 * Renders the initial markers on the map
 * @param {*} locations
 */
const mapInitialization = async (locations, block, ph) => {
  const centerPoint = getCenterPoint();
  await loadScript('/ext-libs/mapbox-gl-js/v3.6.0/mapbox-gl.js');
  await loadCSS('/ext-libs/mapbox-gl-js/v3.6.0/mapbox-gl.css');
  mapboxgl.accessToken = getAccessToken();
  const mapContainer = block.querySelector('.map');
  mapContainer.innerHTML = '';

  map = new mapboxgl.Map({
    container: mapContainer,
    style: 'mapbox://styles/mapbox/light-v8',
    pitchWithRotate: false,
    dragRotate: false,
    scrollZoom: true,
    dragPan: true,
    boxZoom: false,
  });

  map.setCenter([centerPoint.longitude, centerPoint.latitude]);
  map.setZoom(centerPoint.zoom);
  applyMarkers(locations);

  map.on('load', () => {
    map.setCenter([centerPoint.longitude, centerPoint.latitude]);
  });

  map.on('dragend', () => {
    dragAndZoom(locations, block, ph);
  });

  map.on('zoomend', () => {
    dragAndZoom(locations, block, ph);
  });
};

const setMapError = (block, text) => {
  const mapSearchError = block.querySelector('.map-search-error');
  mapSearchError.textContent = text;
  mapSearchError.classList.add('unhide');
};

const mapInputSearchOnCLick = async (block, locations, ph) => {
  const inputText = document.querySelector('.map-input').value;
  if (inputText) {
    const mapSearchError = block.querySelector('.map-search-error');
    mapSearchError.classList.remove('unhide');
    const countryCode = getCountry();
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${inputText}.json?access_token=${getAccessToken()}&limit=10&country=${countryCode}&types=region,postcode,place`,
    );

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.log(`HTTP error! status: ${response.status}`);
      setMapError(block, ph.nolocationfoundtext);
      return;
    }

    const data = await response.json();

    if (data?.features?.length === 0) {
      setMapError(block, ph.nolocationfoundtext);
      return;
    }

    const stateFound = !inputText.includes(',')
      ? data.features.find((element) => element.place_type[0] === 'region') : false;

    const resultObj = stateFound ? {
      center: stateFound.center,
      lat: stateFound.center[1],
      lng: stateFound.center[0],
      city: stateFound.text,
      placeName: stateFound.place_name,
      zipcode: stateFound.zipcode,
    } : {
      center: data.features[0].center,
      lat: data.features[0].center[1],
      lng: data.features[0].center[0],
      city: data.features[0].text,
      placeName: data.features[0].place_name,
      zipcode: data.features[0].zipcode,
    };

    if (map && locations.length > 0) {
      if (stateFound) {
        const { bbox } = stateFound;
        await map.fitBounds([
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ]);
      } else {
        await map.flyTo({
          center: [resultObj.lng, resultObj.lat],
          zoom: 8,
          speed: 1.2,
          curve: 1.5,
          easing: (t) => t,
          essential: true,
          duration: 1000,
        });
      }
    } else {
      setMapError(block, ph.nolocationfoundtext);
    }
  } else {
    setMapError(block, ph.servicemaperrortext);
  }
};

/**
 * Method to get current location on click
 * @param {*} block
 * @param {*} locations
 * @param {*} ph
 */
const mapInputLocationOnClick = (block, locations, ph) => {
  const successCallback = async (position) => {
    await map?.flyTo({
      center: [position.coords.longitude, position.coords.latitude],
      zoom: 8,
      speed: 1.2,
      curve: 1.5,
      easing: (t) => t,
      essential: true,
      duration: 1000,
    });
  };

  const errorCallback = async () => {
    if (navigator.permissions) {
      const res = await navigator.permissions.query({ name: 'geolocation' });
      if (res.state === 'denied') {
        // eslint-disable-next-line no-alert
        alert(ph.servicemapcurrentlocationdeniederrortext);
      }
    } else {
      // eslint-disable-next-line no-alert
      alert(ph.servicemapcurrentlocationunableerrortext);
    }
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
  } else {
    // eslint-disable-next-line no-alert
    alert(ph.servicemapcurrentlocationunableerrortext);
  }
};

/**
 * Map search component
 * @param {*} ph
 * @param {*} block
 * @param {*} locations
 * @param {*} isDropoff
 * @returns
 */
const mapSearch = (ph, block, locations) => {
  const mapInputSearch = button({ class: 'map-input-search' }, ph.searchtext);
  mapInputSearch.addEventListener('click', async () => {
    await mapInputSearchOnCLick(block, locations, ph);
  });

  const mapInputLocation = button({ class: 'map-input-location' }, ph.uselocationtext);
  mapInputLocation.addEventListener('click', async () => {
    mapInputLocationOnClick(block, locations, ph);
  });

  return div(
    { class: 'map-search' },
    div(
      { class: 'map-input-details' },
      input({ class: 'map-input', 'aria-label': 'Search' }),
      mapInputSearch,
      mapInputLocation,
    ),
    div({ class: 'map-search-error' }),
  );
};

export default async function decorate(block) {
  const defaultImage = block.querySelector('img'); // Default Image which we need to show initially
  const defaultImageSrc = defaultImage?.src;
  block.replaceChildren();
  const ph = await fetchPlaceholders(`/${getLocale()}`);
  const isDropoff = Boolean(getMetadata('is-drop-off'));
  const locations = await fetchLocations(isDropoff, ph);

  block.append(
    mapSearch(ph, block, locations),
    div({ class: 'map-details' }, div({ class: 'map-list' }), div({ class: 'map' })),
  );

  if (defaultImageSrc) {
    const mapContainer = block.querySelector('.map');
    mapContainer.style.backgroundImage = `url(${defaultImageSrc})`;
  }

  calculateLocationListDistance(locations, getCenterPoint());
  renderAndSortLocationList(locations, block, ph);
  decorateAnchors(block);
  window.setTimeout(() => mapInitialization(locations, block, ph), 3000);
}
