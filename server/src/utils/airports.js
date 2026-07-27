// Global Airport IATA Coordinates Registry for Real-Time Weather Intelligence
const AIRPORTS = {
  DEL: { name: 'Indira Gandhi Intl', city: 'New Delhi', country: 'India', lat: 28.5562, lon: 77.1000 },
  DXB: { name: 'Dubai International', city: 'Dubai', country: 'UAE', lat: 25.2532, lon: 55.3657 },
  LHR: { name: 'London Heathrow', city: 'London', country: 'UK', lat: 51.4700, lon: -0.4543 },
  FRA: { name: 'Frankfurt Main', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lon: 8.5622 },
  SIN: { name: 'Singapore Changi', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915 },
  JFK: { name: 'John F. Kennedy Intl', city: 'New York', country: 'USA', lat: 40.6413, lon: -73.7781 },
  SFO: { name: 'San Francisco Intl', city: 'San Francisco', country: 'USA', lat: 37.6213, lon: -122.3790 },
  DOH: { name: 'Hamad International', city: 'Doha', country: 'Qatar', lat: 25.2609, lon: 51.6138 },
  HND: { name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan', lat: 35.5494, lon: 139.7798 },
  BOM: { name: 'Chhatrapati Shivaji Intl', city: 'Mumbai', country: 'India', lat: 19.0896, lon: 72.8656 },
  CDG: { name: 'Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lon: 2.5479 },
  AMS: { name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lon: 4.7683 },
  LAX: { name: 'Los Angeles Intl', city: 'Los Angeles', country: 'USA', lat: 33.9416, lon: -118.4085 },
  ORD: { name: 'Chicago O\'Hare', city: 'Chicago', country: 'USA', lat: 41.9742, lon: -87.9073 },
  SYD: { name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', lat: -33.9399, lon: 151.1753 },
};

function getAirport(code) {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  return AIRPORTS[upper] || { name: `${upper} Airport`, city: upper, country: 'Global', lat: 25.0, lon: 55.0 };
}

module.exports = { AIRPORTS, getAirport };
