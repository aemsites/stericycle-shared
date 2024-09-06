import { decorateIcons, loadCSS, loadScript } from '../../scripts/aem.js';
import { a, div, p, span } from '../../scripts/dom-helpers.js';
import ffetch from '../../scripts/ffetch.js';
import { usStates } from './us-states.js';

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

function toDegrees(radians) {
  return radians * 180 / Math.PI;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); // Distance in kilometers
  // todo piyush fetch distance in metres
}

function calculateCentroid(locations) {
  let x = 0, y = 0, z = 0;
  const total = locations.length;

  locations.forEach(location => {
    if (Number(location.lat) !== 0 || Number(location.lng) !== 0) {
      const latitude = toRadians(location.lat);
      const longitude = toRadians(location.lng);

      x += Math.cos(latitude) * Math.cos(longitude);
      y += Math.cos(latitude) * Math.sin(longitude);
      z += Math.sin(latitude);
    }
  });

  x = x / total;
  y = y / total;
  z = z / total;

  const centralLongitude = Math.atan2(y, x);
  const centralSquareRoot = Math.sqrt(x * x + y * y);
  const centralLatitude = Math.atan2(z, centralSquareRoot);

  return {
    lat: toDegrees(centralLatitude),
    lng: toDegrees(centralLongitude)
  };
}

function applyMarkers(locations, map, bounds, locationContainer, centroid) {
  locations.forEach(location => {
    location.distance = haversineDistance(location.lat, location.lng, centroid.lat, centroid.lng);
  });
  
  locations.sort((a, b) => a.distance - b.distance);
  
  locations.forEach((location, index) => {
    const el = div({ class: 'marker' }, span({ class: 'icon icon-marker', id: `marker-${index}` }));

    el.addEventListener('click', () => {
      const spanEl = el.querySelector('span');
      spanEl.innerHTML = '';
      if (spanEl.classList.contains('icon-marker')) {
        document.querySelectorAll('.icon-marker-bold').forEach(marker => {
          marker.classList.remove('icon-marker-bold');
          marker.classList.add('icon-marker');
          marker.innerHTML = '';
          console.log(marker);
          decorateIcons(marker.parentElement);
        });    

        spanEl.classList.remove('icon-marker');
        spanEl.classList.add('icon-marker-bold');

        const id = spanEl.id.split('-')[1];

        const mapList = document.querySelector('.block.service-location-map .map-list');
        const targetDiv = document.getElementById(`location-${id}`);

        if (targetDiv && mapList) {
          mapList.scrollTop = targetDiv.offsetTop - mapList.offsetTop;
        }
      } else {
        spanEl.classList.remove('icon-marker-bold');
        spanEl.classList.add('icon-marker');
      }

      decorateIcons(el);
    });
    decorateIcons(el);

    new mapboxgl.Marker(el)
      .setLngLat([location.lng, location.lat])
      .addTo(map);

    bounds.extend([location.lng, location.lat]);

    const locationDiv = div({ class: 'location-item', id: `location-${index}`, name: location.name },
      p({ class: 'title' }, location.title));

    if (location['address-line-1'] && location['address-line-1'] !== '0') {
      locationDiv.appendChild(p({ class: 'address' }, location['address-line-1']));
    }

    if (location['address-line-2'] && location['address-line-2'] !== '0') {
      locationDiv.appendChild(p({ class: 'address' }, location['address-line-2']));
    }

    if (location['address-line-3'] && location['address-line-3'] !== '0') {
      locationDiv.appendChild(p({ class: 'address' }, location['address-line-3']));
    }

    locationDiv.appendChild(p({ class: 'distance' },
      `${location.distance} km`));
    
    if (location['location'] && location.city) {
      locationDiv.appendChild(p({ class: 'location' },
        a({ href: `${window.location.pathname}/${location.city.toLowerCase().trim().split(' ').join('-')}` }, location['location'])));
    }
    locationContainer.appendChild(locationDiv);
  });
}

async function fetchLocations() {
  const currentPath = window.location.pathname;
  const isDropoff = currentPath.includes('/secure-shredding-services/drop-off-shredding');
  return await ffetch('/query-index.json').sheet('locations').map(x => {    
    const getValueOrNull = value => (value == null || value === 0 || value === '0') ? null : value;
    const mp = {
      lat: x.latitude,
      lng: x.longitude,
      'zip-code': getValueOrNull(x['zip-code']),
      city: getValueOrNull(x.city),
      state: getValueOrNull(x.state),
      name: getValueOrNull(x.name),
    }

    if (isDropoff) {
      mp.title = x['address-line-1'] || '';
      mp['address-line-1'] = x['address-line-2'] || '';
      mp['address-line-2'] =  [mp.city, usStates[mp.state], mp['zip-code']].filter(Boolean).join(', ');
    } else {
      mp.title = `Shred-it ${mp.name || mp.city}`;
      mp['address-line-1'] = x['address-line-1'] || '';
      mp['address-line-2'] = x['address-line-2'] || '';
      mp['address-line-3'] =  [mp.city, usStates[mp.state], mp['zip-code']].filter(Boolean).join(', ');
      mp['location'] = `go to ${mp.title}`;
    }

    return mp;
  })
  .filter(x => isDropoff ? x['drop-off'] === '1' : true)
  .all();
}

const mapList = async (block) => {
  mapboxgl.accessToken = 'pk.eyJ1Ijoic3RlcmljeWNsZSIsImEiOiJjbDNhZ3M5b3AwMWphM2RydWJobjY3ZmxmIn0.xt2cRdtjXnnZXXXLt3bOlQ';

  const locations = await fetchLocations();
  const centroid = calculateCentroid(locations);

  const mapContainer = block.querySelector('.map');
  const locationContainer = block.querySelector('.map-list');


  var map = new mapboxgl.Map({
    container: mapContainer,
    style: 'mapbox://styles/mapbox/light-v8',
    center: [0, 0],
    zoom: 2
  });

  const bounds = new mapboxgl.LngLatBounds();
  // console.log(bounds);
  applyMarkers(locations, map, bounds, locationContainer, centroid);

  console.log(bounds)
  map.setCenter([Number(centroid.lng), Number(centroid.lat)]);

  map.on('zoom', () => {
    const zoomLevel = map.getZoom(); // Get the current zoom level
    console.log('Current zoom level:', zoomLevel);
  });

  // map.fitBounds(bounds, {
  //   padding: 50,
  //   // maxZoom: 15,
  //   duration: 100
  // });
}

// Function to fly to location when clicked
function flyToLocation(lat, lng) {
  map.flyTo({
    center: [lng, lat],
    essential: true, // This ensures the animation is necessary in case of browser performance issues
    zoom: 12
  });
}

export default async function decorate(block) {
  const mapListDiv = div({ class: 'map-list'});
  const mapDiv = div({ class: 'map' });
  await loadScript("https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js");
  await loadCSS("https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css");

  block.append(mapListDiv, mapDiv);
  await mapList(block);
}