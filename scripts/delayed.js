// eslint-disable-next-line import/no-cycle

/* eslint-disable */
import {
  fetchPlaceholders, getMetadata, loadCSS, sampleRUM,
} from './aem.js';
// eslint-disable-next-line import/no-cycle
import { getDateFromExcel, getRelatedPosts } from './scripts.js';
import decorate from '../blocks/post-teaser-list/post-teaser-list.js';
import usStates from '../blocks/service-location-map/us-states.js';
// import { getLocale } from '../../scripts/scripts.js';

import {
  a,
  div,
  p,
  span,
  h2,
  input,
  button,
} from '../scripts/dom-helpers.js';
import {
  decorateIcons,
  loadScript,
  // loadCSS,
  // fetchPlaceholders,
  isDesktop,
} from '../scripts/aem.js';
import ffetch from './ffetch.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');
const RELATED_LIMIT = 4;

function getLocale() {
  const locale = getMetadata('locale');
  if (locale && locale.length > 0) {
    return locale;
  }
  // defaulting to en-us
  return 'en-us';
}

async function loadRelatedContent() {
  const tags = (getMetadata('article:tag') || '').split(/,\s*]/);
  const posts = await getRelatedPosts(['Blogs'], tags, RELATED_LIMIT);

  const rcTeasers = document.createElement('ul');
  rcTeasers.className = 'related-content-teasers';
  const placeholders = await fetchPlaceholders(`/${getLocale()}`);
  const { relatedcontent } = placeholders;

  posts.forEach((post) => {
    const teaser = document.createElement('li');
    const teaserLink = document.createElement('a');
    const teaserDiv = document.createElement('div');
    const teaserDate = document.createElement('div');
    teaserDate.className = 'related-content-date';
    const teaserTitle = document.createElement('h5');
    teaserTitle.innerText = post.title;
    const pDate = getDateFromExcel(post.date);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    teaserDate.innerText = `${months[pDate.getMonth()]} ${pDate.getDate() + 1}, ${pDate.getFullYear()}`;
    const teaserPicture = document.createElement('picture');
    teaserDiv.append(teaserPicture);
    teaserDiv.append(teaserTitle);
    teaserDiv.append(teaserDate);
    const teaserImg = document.createElement('img');
    teaserImg.src = post.image;
    teaserImg.alt = post.title;
    teaserPicture.append(teaserImg);
    teaserLink.setAttribute('aria-label', post.title);
    teaserLink.append(teaserDiv);
    teaser.append(teaserLink);
    teaserLink.href = post.path;
    teaser.className = 'related-content-teaser';

    rcTeasers.append(teaser);
  });

  const rcHeader = document.querySelector('h4.related-content-header');
  rcHeader.innerText = relatedcontent;
  rcHeader.insertAdjacentElement('afterend', rcTeasers);
}

async function loadYMAL() {
  const placeholders = await fetchPlaceholders(`/${getLocale()}`);
  const { ymal } = placeholders;
  const mltSection = document.createElement('div');
  mltSection.className = 'section box-shadow post-teaser-list-container';
  const mltWrapper = document.createElement('div');
  mltWrapper.className = 'default-content-wrapper';
  mltSection.append(mltWrapper);
  const ptlBlock = document.createElement('div');
  ptlBlock.className = 'post-teaser-list cards';
  mltWrapper.append(ptlBlock);
  const mtype = document.querySelector('meta[name="media-type"]');
  let sheet = 'infographics';
  if (mtype) {
    sheet = mtype.getAttribute('content').toLowerCase();
    //  infographic -> infographics - all should end with 's'
    if (!sheet.endsWith('s')) {
      sheet = `${sheet}s`;
    }
  }
  ptlBlock.innerHTML = `<div>
          <div>Type</div>
          <div>${sheet}</div>
        </div>`;
  decorate(ptlBlock);
  loadCSS('/blocks/post-teaser-list/post-teaser-list.css');
  const mltHeader = document.createElement('h3');
  mltHeader.innerText = ymal;
  mltWrapper.prepend(mltHeader);

  const mainSection = document.querySelector('main > div.section');
  mainSection.insertAdjacentElement('afterend', mltSection);
}

// load this only on blog pages
if (document.querySelector('body.blog-page')) {
  await loadRelatedContent();
}

if (document.querySelector('body.resource-center')
    && (document.querySelector('meta[name="media-type"]')?.getAttribute('content') === 'Infographic'
        || document.querySelector('meta[name="media-type"]')?.getAttribute('content') === 'Info Sheets')) {
  await loadYMAL();
}


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
    p({ class: 'title' }, location.title),
  );

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
    locationDiv.appendChild(
      p({ class: 'opening-hours' }, location['opening-hours']),
    );
  }

  if (location['gmap-link']) {
    locationDiv.appendChild(
      p(
        { class: 'gmap' },
        a({ href: location['gmap-link'] }, 'Get Directions'),
      ),
    );
  }

  if (location['drop-off-details']) {
    locationDiv.appendChild(
      p({ class: 'drop-off-details' }, location['drop-off-details']),
    );
  }

  if (location['location-link'] && location.title) {
    locationDiv.appendChild(
      a(
        { class: 'location', href: `${window.location.pathname}/${location.title.toLowerCase().trim().split(' ').join('-')}` },
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
    .filter((x) => (x.latitude !== '0' && x.longitude !== '0'))
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
        'additional-cities': getValueOrNull(x['additional-cities']), // todo piyush check this
        'sub-type': getValueOrNull(x['sub-type']), // todo piyush check this
        'opening-hours': getValueOrNull(x['opening-hours']), // todo piyush check this
        'drop-off-details1': getValueOrNull(x['drop-off-details1']), // todo piyush check this
        'drop-off-details2': getValueOrNull(x['drop-off-details2']), // todo piyush check this
      };

      if (isDropoff) {
        mp.title = getValueOrNull(x['address-line-1']);
        mp['address-line-1'] = getValueOrNull(x['address-line-2']);
        mp['address-line-2'] = [mp.city, usStates[mp.state], mp['zip-code']].filter(Boolean).join(', ');
        mp['gmap-link'] = `https://www.google.com/maps/dir/${[mp.title, mp['address-line-1'], mp['address-line-2']].filter(Boolean).join(', ')}`;
        mp['buy-now'] = mp['zip-code'] ? `https://shop-shredit.stericycle.com/commerce_storefront_ui/walkin.aspx?zip=${mp['zip-code']}` : '';
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
    .filter((x) => (isDropoff ? x['sub-type']?.trim().toLowerCase() === 'drop-off' : true))
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

const getContactUshref = () => {
  // todo piyush
  const temp = getCountry();
  return `/${temp}/contact-us`;
};

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
    tempP.appendChild(a({ href: getContactUshref() }, ph.contactustext));
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
  const bounds = map.getBounds();

  const tempLocations = locations
    .filter((location) => bounds.contains([location.lng, location.lat]))
    .map((location) => {
      location.distance = haversineDistance(
        location.lat,
        location.lng,
        map.getCenter().lat,
        map.getCenter().lng,
      );
      return location;
    });

  renderAndSortLocationList(tempLocations, block, ph);
};

/**
 * Renders the initial markers on the map
 * @param {*} locations
 */
const mapInitialization = (locations, block, ph) => {
  const centerPoint = getCenterPoint();

  // Use requestIdleCallback for map loading
  requestIdleCallback(async () => {
    if (isDesktop()) {
      // Load Mapbox script and CSS during idle time
      await loadScript('/ext-libs/mapbox-gl-js/v3.6.0/mapbox-gl.js');
      await loadCSS('/ext-libs/mapbox-gl-js/v3.6.0/mapbox-gl.css');
      
      // Set the Mapbox access token
      mapboxgl.accessToken = getAccessToken();
      const mapContainer = block.querySelector('.map');

      // Initialize the map
      map = new mapboxgl.Map({
        container: mapContainer,
        style: 'mapbox://styles/mapbox/light-v8',
        pitchWithRotate: false,
        dragRotate: false,
        scrollZoom: true,
        dragPan: true,
        boxZoom: false, // Disabled as per requirement
      });

      // Set the map center and zoom level
      map.setCenter([centerPoint.longitude, centerPoint.latitude]);
      map.setZoom(centerPoint.zoom);

      // Apply markers
      applyMarkers(locations);

      // Recenter map after load
      map.on('load', () => {
        map.setCenter([centerPoint.longitude, centerPoint.latitude]);
      });

      // Handle map drag and zoom events
      map.on('drag', () => {
        dragAndZoom(locations, block, ph);
      });

      map.on('zoom', () => {
        dragAndZoom(locations, block, ph);
      });
    }
  });

  // Handle distance calculation and sorting after idle time
  calculateLocationListDistance(locations, centerPoint);
  renderAndSortLocationList(locations, block, ph);
};


const searchMatch = (locations, city, placeName, zipcode) => {
  const matchedLocations = locations.filter((item) => {
    const cityLower = city?.trim().toLowerCase();
    const zipcodeLower = zipcode?.trim().toLowerCase();
    const itemCityLower = item.city?.trim().toLowerCase();
    const itemZipcodeLower = item['zip-code']?.trim().toLowerCase();
    const placeNameLower = placeName?.trim().toLowerCase();
    const itemStateLower = item.state?.trim().toLowerCase();

    return (itemCityLower && cityLower && (itemCityLower === cityLower))
      || (placeNameLower && itemCityLower && placeNameLower?.includes(itemCityLower))
      || (itemZipcodeLower && zipcodeLower && (itemZipcodeLower === zipcodeLower))
      || (placeNameLower && itemStateLower && placeNameLower?.includes(itemStateLower))
      || (item['additional-cities']?.some((element) => element?.trim().toLowerCase().includes(cityLower)));
  });

  return matchedLocations.length > 0 ? matchedLocations : [];
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

    const result = searchMatch(
      locations,
      resultObj.city,
      resultObj.placeName,
      resultObj.zipcode,
    );

    if (result.length > 0) {
      if (stateFound) {
        const { bbox } = stateFound;
        map.fitBounds([
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ]);
      } else {
        map.setZoom(8);
        map.setCenter([resultObj.lng, resultObj.lat]);
        map.setCenter([resultObj.lng, resultObj.lat]);
        renderAndSortLocationList(result, block, ph);
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
    await map.flyTo({
      center: [position.coords.longitude, position.coords.latitude],
      zoom: 8,
      speed: 1.2,
      curve: 1.5,
      easing: (t) => t,
      essential: true,
      duration: 1000,
    });
    dragAndZoom(locations, block, ph);
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
const mapSearch = (ph, block, locations, isDropoff) => {
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
    h2(ph.servicemapdropofftext),
    p(isDropoff ? ph.servicemapbranchtext : ph.servicemapziptext),
    div(
      { class: 'map-input-details' },
      input({ class: 'map-input', 'aria-label': 'Search' }),
      mapInputSearch,
      mapInputLocation,
    ),
    div({ class: 'map-search-error' }),
  );
};

const getIsDropoff = () => {
  const currentPath = window.location.pathname;
  return currentPath.includes('/secure-shredding-services/drop-off-shredding');
};

if (true) {
  const ph = await fetchPlaceholders(`/${getLocale()}`);
  const isDropoff = getIsDropoff();

  const locations = await fetchLocations(isDropoff, ph);
  const block = document.querySelector('.block.service-location-map');
  mapInitialization(locations, block, ph);
}
