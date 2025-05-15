import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

// Fix default marker icon issue with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function Map() {
  const [position, setPosition] = useState([12.971599, 77.594566]); // Bengaluru
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const lat = parseFloat(latitude || position[0]);
    const lng = parseFloat(longitude || position[1]);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Please enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:8000/sustainability-result',
        { latitude: lat, longitude: lng },
        { headers: { 'Content-Type': 'application/json' } }
      );
      navigate('/result', { state: { data: response.data } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch sustainability report.');
      setLoading(false);
    }
  };

  const handleMapClick = (newPosition) => {
    setPosition(newPosition);
    setLatitude(newPosition[0].toFixed(4));
    setLongitude(newPosition[1].toFixed(4));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Sustainability Analysis Platform</h1>
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6">
        <div className="mb-4">
          <MapContainer
            center={position}
            zoom={13}
            style={{ height: '400px', width: '100%', zIndex: 10 }}
            className="rounded-lg"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker setPosition={handleMapClick} />
            {position && (
              <Marker position={position}>
                <Popup>
                  Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                Latitude
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g., 34.0522"
                className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                Longitude
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g., -118.2437"
                className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition duration-200"
          >
            {loading ? 'Loading...' : 'Get Sustainability Report'}
          </button>
        </form>
      </div>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center max-w-md">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 mb-4"></div>
            <p className="text-gray-700 text-lg text-center">
              Data is being fetched and calculated. This may take approximately 1 to 3 minutes. Please do not refresh the page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Map;