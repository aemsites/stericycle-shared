/* global mapboxgl */

import {
  a,
  div,
  h2,
  label,
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
  readBlockConfig,
} from '../../scripts/aem.js';
import usStates from './us-states.js';
import { decorateAnchors, fetchQueryIndex, getLocale, haversineDistance, formatDistance } from '../../scripts/scripts.js';
import { sendDigitalDataEvent, sendEcommEntryPointEvent } from '../../scripts/martech.js';
import { resolveFlowUrl } from '../../scripts/ecommerce-flow.js';
import { getUtmParams } from '../form/utm.js';

let map = null;
let referencePoint = null;
let dropoffMode = false;

const RADIUS_KM = 80.4672;
const LEGACY_BUY_NOW = 'https://shop-shredit.stericycle.com/commerce_storefront_ui/walkin.aspx?zip={zip}';

let ecommerceFlowTemplate = null;
let resolvedUtmParams = {};

const setReferencePoint = (latitude, longitude) => {
  referencePoint = { latitude, longitude };
};

const buildBuyNowUrl = (template, zip, utmParams) => {
  let url = template;
  if (url.includes('{zip}')) {
    if (zip) {
      url = url.replace('{zip}', encodeURIComponent(zip));
    } else {
      url = url.replace(/[^?&]*\{zip\}[^&]*(&|$)/, '$1').replace(/[?&]$/, '');
    }
  }
  const extra = Object.entries(utmParams ?? {}).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  if (!extra) return url;
  return url.includes('?') ? `${url}&${extra}` : `${url}?${extra}`;
};

const getAccessToken = () => 'pk.eyJ1IjoiY29saW4tdmxhc2FrIiwiYSI6ImNtbTJlZDk1NjA3YzgyeHEyaHcycjRsOHAifQ.l8VGncsCvMaPyEpwkCSPPg';

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

  if (Number.isFinite(location.distance)) {
    locationDiv.appendChild(
      p({ class: 'distance' }, formatDistance(location.distance)),
    );
  }

  if (location['opening-hours']) {
    const tempP = p({ class: 'opening-hours' });
    tempP.innerHTML = location['opening-hours'];
    locationDiv.appendChild(tempP);
  }

  if (location['gmap-link']) {
    locationDiv.appendChild(
      p(
        { class: 'gmap' },
        a({ href: location['gmap-link'] }, ph.getdirectionstext || 'Get Directions'),
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

  if (dropoffMode && location['sub-type']?.toLowerCase() === 'drop-off' && getLocale() === 'en-us') {
    const template = ecommerceFlowTemplate ?? LEGACY_BUY_NOW;
    const href = buildBuyNowUrl(template, location['zip-code'], resolvedUtmParams);
    const buyNow = a({ class: 'buy-now', href }, ph.buynowtext);
    // BR.410 drop-off eComm entry point (STERICMS-1028). The buy-now anchor navigates to the
    // eComm portal; fire the tracking event synchronously on click, before navigation. No form
    // context here, so PII flags default to 'N' and leadId to null. serviceAddress removed per
    // PII request (Ivan/Vivek, STERICMS-1011).
    buyNow.addEventListener('click', () => {
      sendEcommEntryPointEvent({
        serviceLine: 'Drop-Off',
        eCommEntryPoint: 'Y',
        zipCode: location['zip-code'] || '',
      });
    });
    locationDiv.appendChild(buyNow);
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

const toCoord = (value) => {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) && n !== 0 ? n : null;
};

async function fetchLocations(isDropoff, ph) {
  return (await fetchQueryIndex(undefined, 'locations')
    .filter((x) => {
      const lat = toCoord(x.latitude);
      const lng = toCoord(x.longitude);
      return lat !== null && lng !== null
        && (isDropoff ? x['sub-type']?.trim().toLowerCase() === 'drop-off' : true)
        && (x.locale?.trim().toLowerCase() === getLocale());
    })
    .map((x) => {
      const getValueOrNull = (value) => (value == null || value === 0 || value === '0' ? null : value);
      const mp = {
        lat: toCoord(x.latitude),
        lng: toCoord(x.longitude),
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

function applyMarkers(locations, block, ph, isDropoff) {
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
            if (isDropoff && targetDiv.dataset.revealed === 'true') {
              targetDiv.remove();
            }
          }
          marker.innerHTML = '';
          decorateIcons(marker.parentElement);
        });

        spanEl.classList.remove('icon-marker');
        spanEl.classList.add('icon-marker-bold');

        const mapList = block.querySelector('.map-list');
        let targetDiv = document.getElementById(`location-${location.index}`);

        if (!targetDiv && isDropoff && mapList) {
          mapList.querySelector('.prompt-card')?.remove();
          location.distance = referencePoint
            ? haversineDistance(location.lat, location.lng, referencePoint.latitude, referencePoint.longitude)
            : undefined;
          targetDiv = locDivCreation(location, ph);
          targetDiv.dataset.revealed = 'true';
          mapList.append(targetDiv);
        }

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
          if (isDropoff && targetDiv.dataset.revealed === 'true') {
            targetDiv.remove();
          }
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

const renderLocationList = (locations, block, ph, state) => {
  const locationContainer = block.querySelector('.map-list');
  locationContainer.querySelectorAll('.location-item[data-revealed="true"]').forEach((revealedCard) => {
    const id = revealedCard.id.split('-')[1];
    const marker = document.getElementById(`marker-${id}`);
    if (marker) {
      marker.classList.remove('icon-marker-bold');
      marker.classList.add('icon-marker');
      marker.innerHTML = '';
      decorateIcons(marker.parentElement);
    }
  });

  locationContainer.innerHTML = '';
  locationContainer.classList.remove('no-result', 'prompt');
  if (block.classList.contains('drop-off')) {
    locationContainer.appendChild(
      h2({ class: 'map-list-heading' }, ph.dropoffpanelheadingtext || 'Shred-It Facilities'),
    );
  }

  const resolvedState = state ?? (locations.length === 0 ? 'no-results' : 'results');

  if (resolvedState === 'prompt') {
    locationContainer.classList.add('prompt');
    const promptCard = div({ class: 'location-item prompt-card' });
    promptCard.appendChild(p({}, ph.dropoffsearchprompttext
      || 'Please enter, State, City or ZIP in the search and your facility will populate'));
    locationContainer.appendChild(promptCard);
  } else if (resolvedState === 'no-results') {
    const tempP = dropoffMode
      ? p({}, span({}, `${ph.servicemapcurrentlocationnoresulttextpre} `))
      : p({ class: 'no-result' }, span({}, `${ph.servicemapcurrentlocationnoresulttextpre} `));
    tempP.appendChild(a({ href: getContactUshref(ph) }, ph.contactustext));
    tempP.appendChild(span({}, ` ${ph.servicemapcurrentlocationnoresulttextpost}`));
    if (dropoffMode) {
      const noResultCard = div({ class: 'location-item' });
      noResultCard.appendChild(tempP);
      locationContainer.appendChild(noResultCard);
    } else {
      locationContainer.appendChild(tempP);
    }
    locationContainer.classList.add('no-result');
  } else {
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

const renderAndSortLocationList = (locations, block, ph, state) => {
  sortLocationList(locations);
  renderLocationList(locations, block, ph, state);
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

const fitMapToRadius = (lat, lng) => {
  if (!map) return;
  const dLat = RADIUS_KM / 111.32;
  const dLng = RADIUS_KM / (111.32 * Math.cos(lat * (Math.PI / 180)));
  map.fitBounds(
    [[lng - dLng, lat - dLat], [lng + dLng, lat + dLat]],
    { padding: 20 },
  );
};

const dragAndZoom = (locations, block, ph, isDropoff) => {
  if (isDropoff && !referencePoint) return;
  const bounds = map?.getBounds();

  const tempLocations = locations
    .filter((location) => {
      if (!bounds?.contains([location.lng, location.lat])) return false;
      if (isDropoff && referencePoint) {
        return haversineDistance(location.lat, location.lng, referencePoint.latitude, referencePoint.longitude) <= RADIUS_KM;
      }
      return true;
    })
    .map((location) => {
      const refLat = (isDropoff && referencePoint) ? referencePoint.latitude : map?.getCenter().lat;
      const refLng = (isDropoff && referencePoint) ? referencePoint.longitude : map?.getCenter().lng;
      location.distance = haversineDistance(location.lat, location.lng, refLat, refLng);
      return location;
    });

  renderAndSortLocationList(tempLocations, block, ph);
};

const mapInitialization = async (locations, block, ph, isDropoff) => {
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
  applyMarkers(locations, block, ph, isDropoff);

  map.on('load', () => {
    if (isDropoff && referencePoint) {
      fitMapToRadius(referencePoint.latitude, referencePoint.longitude);
    } else {
      map.setCenter([centerPoint.longitude, centerPoint.latitude]);
    }
    const mapInputLocationButton = block.querySelector('.map-input-location');
    mapInputLocationButton?.classList.remove('disabled');
    mapInputLocationButton?.removeAttribute('disabled');
    const mapInputSearchButton = block.querySelector('.map-input-search');
    mapInputSearchButton?.classList.remove('disabled');
    mapInputSearchButton?.removeAttribute('disabled');
  });

  map.on('dragend', () => {
    dragAndZoom(locations, block, ph, isDropoff);
  });

  map.on('zoomend', () => {
    dragAndZoom(locations, block, ph, isDropoff);
  });
};

const setMapError = (block, text) => {
  const mapSearchError = block.querySelector('.map-search-error');
  mapSearchError.textContent = text;
  mapSearchError.classList.add('unhide');
};

const mapInputSearchOnCLick = async (block, locations, ph, type) => {
  const inputText = document.querySelector('.map-input').value;
  if (inputText) {
    const mapSearchError = block.querySelector('.map-search-error');
    mapSearchError.classList.remove('unhide');
    const countryCode = getCountry();
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${inputText}.json?access_token=${getAccessToken()}&limit=10&country=${countryCode}&types=region,postcode,place`,
      { referrerPolicy: 'origin' },
    );

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.log(`HTTP error! status: ${response.status}`);
      setMapError(block, ph.nolocationfoundtext);
      return;
    }

    const data = await response.json();

    sendDigitalDataEvent({
      event: 'search',
      searchType: type,
      searchTerm: inputText,
      searchResultRange: data?.features?.length || 0,
      searchMethod: 'typed',
    });

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

    setReferencePoint(resultObj.lat, resultObj.lng);

    if (map && locations.length > 0) {
      if (dropoffMode) {
        map.once('moveend', () => dragAndZoom(locations, block, ph, true));
      }
      if (stateFound) {
        const { bbox } = stateFound;
        await map.fitBounds([
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ]);
      } else {
        fitMapToRadius(resultObj.lat, resultObj.lng);
      }
    } else {
      setMapError(block, ph.nolocationfoundtext);
    }
  } else {
    setMapError(block, ph.servicemaperrortext);
  }
};

const requestGeolocation = (block, locations, ph, isAutomatic, onSuccess, onDenied) => {
  const successCallback = (position) => {
    const { latitude, longitude } = position.coords;
    setReferencePoint(latitude, longitude);
    fitMapToRadius(latitude, longitude);
    sendDigitalDataEvent({
      event: 'search',
      searchResultRange: locations.filter(
        (loc) => haversineDistance(loc.lat, loc.lng, latitude, longitude) <= RADIUS_KM,
      ).length,
      searchMethod: isAutomatic ? 'auto-geolocation' : 'use-my-location',
    });
    if (onSuccess) onSuccess(position);
  };

  const errorCallback = () => {
    if (!isAutomatic) {
      setMapError(block, ph.servicemapcurrentlocationdeniederrortext);
    }
    if (onDenied) onDenied();
  };

  if (!navigator.geolocation) {
    if (!isAutomatic) setMapError(block, ph.servicemapcurrentlocationunableerrortext);
    if (onDenied) onDenied();
    return;
  }

  if (navigator.permissions) {
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'denied') {
        if (!isAutomatic) setMapError(block, ph.servicemapcurrentlocationdeniederrortext);
        if (onDenied) onDenied();
      } else {
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
      }
    });
  } else {
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
  }
};

const mapInputLocationOnClick = (block, locations, ph) => {
  requestGeolocation(block, locations, ph, false, null, null);
};

const mapSearch = (ph, block, locations, type, isDropoff) => {
  if (!isDropoff) {
    const mapInputSearch = button({ class: 'map-input-search secondary disabled' }, ph.searchtext);
    mapInputSearch.addEventListener('click', async () => {
      await mapInputSearchOnCLick(block, locations, ph, type);
    });

    const mapInputLocation = button({ class: 'map-input-location secondary disabled' }, ph.uselocationtext);
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
  }

  const mapInputSearch = button(
    {
      class: 'map-input-search primary disabled',
      type: 'button',
      disabled: 'disabled',
      'aria-label': ph.searchtext,
    },
    span({ class: 'map-input-search-text' }, ph.searchtext),
    span({ class: 'icon icon-search-mobile' }),
  );
  mapInputSearch.addEventListener('click', async () => {
    await mapInputSearchOnCLick(block, locations, ph, type);
  });

  const mapInputLocation = button(
    { class: 'map-input-location secondary disabled', type: 'button', disabled: 'disabled' },
    ph.uselocationtext,
  );
  mapInputLocation.addEventListener('click', async () => {
    mapInputLocationOnClick(block, locations, ph);
  });

  return div(
    { class: 'map-search' },
    div(
      { class: 'map-input-details' },
      div(
        { class: 'map-input-field' },
        label({ class: 'map-input-label', for: 'map-input' }, ph.searchtext),
        input({
          class: 'map-input',
          id: 'map-input',
          placeholder: ph.searchinputplaceholdertext || 'search by State, City or ZIP',
        }),
      ),
      mapInputSearch,
      mapInputLocation,
    ),
    div({ class: 'map-search-error', role: 'alert' }),
  );
};

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const searchType = config.type.textContent || config.type || 'undefined';
  const defaultImageSrc = config.placeholder;
  block.replaceChildren();
  const ph = await fetchPlaceholders(`/${getLocale()}`);
  const isDropoff = Boolean(getMetadata('is-drop-off'));
  dropoffMode = isDropoff;
  // Kick off the Buy Now resolution up front so its network round-trips overlap with
  // fetchLocations + DOM construction instead of blocking the critical path just before
  // the first render. The results are only consumed once cards render (after geolocation
  // or a user search), so awaiting `ecommerceReady` later adds ~0 to time-to-render.
  let ecommerceReady = Promise.resolve();
  if (isDropoff) {
    block.classList.add('drop-off');
    ecommerceReady = Promise.all([resolveFlowUrl('drop off'), getUtmParams()])
      .then(([template, utm]) => {
        ecommerceFlowTemplate = template;
        resolvedUtmParams = utm;
      });
  }
  const locations = await fetchLocations(isDropoff, ph);
  const urlParams = new URLSearchParams(window.location.search);
  const useMyLocation = urlParams.get('useMyLocation');

  block.append(
    mapSearch(ph, block, locations, searchType, isDropoff),
    div(
      { class: 'map-details' },
      div({ class: 'map-list', 'aria-live': 'polite' }),
      div({ class: 'map' }),
    ),
  );
  decorateIcons(block);

  if (defaultImageSrc) {
    const mapContainer = block.querySelector('.map');
    mapContainer.style.backgroundImage = `url(${defaultImageSrc})`;
  }

  const hashTerm = window.location.hash ? window.location.hash.substring(1) : null;

  // Ensure the Buy Now template/UTM params are resolved before any cards render. These were
  // started earlier and have almost certainly settled by now, so this rarely blocks.
  if (isDropoff) {
    await ecommerceReady;
  }

  calculateLocationListDistance(locations, getCenterPoint());
  if (isDropoff) {
    renderLocationList([], block, ph, 'prompt');
  } else {
    renderAndSortLocationList(locations, block, ph);
  }
  decorateAnchors(block);

  if (isDropoff && !hashTerm) {
    requestGeolocation(block, locations, ph, true, (position) => {
      const { latitude, longitude } = position.coords;
      calculateLocationListDistance(locations, { latitude, longitude });
      const nearby = locations.filter(
        (loc) => haversineDistance(loc.lat, loc.lng, latitude, longitude) <= RADIUS_KM,
      );
      renderAndSortLocationList(nearby, block, ph, nearby.length > 0 ? 'results' : 'no-results');
    }, () => {
      renderLocationList([], block, ph, 'prompt');
    });
  }

  const initMap = async () => {
    await mapInitialization(locations, block, ph, isDropoff);
    if (hashTerm) {
      block.querySelector('.map-input').value = hashTerm;
      await mapInputSearchOnCLick(block, locations, ph, searchType);
    } else if (useMyLocation) {
      mapInputLocationOnClick(block, locations, ph);
    }
  };

  const launchMapInit = () => {
    if (window.requestIdleCallback) {
      requestIdleCallback(() => initMap());
    } else {
      initMap();
    }
  };

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      launchMapInit();
    }
  }, { rootMargin: '200px' });
  observer.observe(block);
}
