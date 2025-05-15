import ee
import numpy as np
import requests
import pandas as pd
from typing import Dict, Optional
from dotenv import load_dotenv
import os

load_dotenv()

project = os.getenv("Google_Console_Project")

# Initialize Google Earth Engine
try:
    ee.Initialize(project=project)
except Exception as e:
    raise Exception(f"Failed to initialize GEE: {str(e)}")

# NASA API endpoint
NASA_API_URL = "https://power.larc.nasa.gov/api/temporal"

# In-memory cache for API and GEE results
_cache: Dict[str, Dict] = {}

def _generate_cache_key(lat: float, lon: float, data_type: str) -> str:
    """Generate a unique cache key based on coordinates and data type."""
    return f"{lat}_{lon}_{data_type}"

def get_nasa_rainfall_data(lat: float, lon: float) -> float:
    """Fetch average annual rainfall from NASA API (1981-2024)."""
    cache_key = _generate_cache_key(lat, lon, "rainfall")
    if cache_key in _cache:
        return _cache[cache_key]

    params = {
        "parameters": "PRECTOTCORR",
        "community": "RE",
        "longitude": lon,
        "latitude": lat,
        "start": "19810101",
        "end": "20241231",
        "format": "JSON"
    }
    try:
        response = requests.get(f"{NASA_API_URL}/daily/point", params=params)
        response.raise_for_status()
        data = response.json()
        rainfall_values = list(data['properties']['parameter']['PRECTOTCORR'].values())
        rainfall_values = [val for val in rainfall_values if val >= 0]
        if not rainfall_values:
            _cache[cache_key] = 0.0
            return 0.0
        total_rainfall = np.sum(rainfall_values)
        avg_rainfall = total_rainfall / (2024 - 1981 + 1)
        result = min(avg_rainfall / 1000, 1.0)
        _cache[cache_key] = result
        return result
    except Exception:
        _cache[cache_key] = 0.0
        return 0.0

def get_nasa_wind_speed_data(lat: float, lon: float) -> float:
    """Fetch average wind speed from NASA API climatology."""
    cache_key = _generate_cache_key(lat, lon, "wind_speed")
    if cache_key in _cache:
        return _cache[cache_key]

    params = {
        "parameters": "WS50M",
        "community": "RE",
        "longitude": lon,
        "latitude": lat,
        "format": "JSON"
    }
    try:
        response = requests.get(f"{NASA_API_URL}/climatology/point", params=params)
        response.raise_for_status()
        data = response.json()
        values = list(data['properties']['parameter']['WS50M'].values())
        values = [v for v in values if v >= 0]
        avg_speed = np.mean(values)
        if avg_speed < 3:
            result = 0.0
        elif avg_speed < 5:
            result = 0.2  
        elif avg_speed < 7:
            result = 0.5  
        elif avg_speed < 9:
            result = 0.75  
        elif avg_speed <= 12:
            result = 1.0  
        else:
            result = 0.0  

        _cache[cache_key] = result
        return result
    except Exception:
        _cache[cache_key] = 0.0
        return 0.0

def get_nasa_solar_data(lat: float, lon: float) -> Optional[pd.DataFrame]:
    """Fetch solar radiation and temperature data from NASA API."""
    cache_key = _generate_cache_key(lat, lon, "solar")
    if cache_key in _cache:
        return _cache[cache_key]

    params = {
        "parameters": "ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,T2M",
        "community": "RE",
        "longitude": lon,
        "latitude": lat,
        "start": "19810101",
        "end": "20241231",
        "format": "JSON"
    }
    try:
        response = requests.get(f"{NASA_API_URL}/daily/point", params=params)
        response.raise_for_status()
        data = response.json()
        properties = data['properties']['parameter']
        dates = list(properties['ALLSKY_SFC_SW_DWN'].keys())
        df = pd.DataFrame({"Date": dates})
        df['ALLSKY_SFC_SW_DWN'] = df['Date'].map(properties['ALLSKY_SFC_SW_DWN'])
        df['CLRSKY_SFC_SW_DWN'] = df['Date'].map(properties['CLRSKY_SFC_SW_DWN'])
        df['T2M'] = df['Date'].map(properties['T2M'])
        df['Date'] = pd.to_datetime(df['Date'], format='%Y%m%d')
        df['Year'] = df['Date'].dt.year
        df['Month'] = df['Date'].dt.month
        df['DayOfYear'] = df['Date'].dt.dayofyear
        df = df[df['ALLSKY_SFC_SW_DWN'] > 0]
        df['Day_Sin'] = np.sin(2 * np.pi * df['DayOfYear'] / 365)
        df['Day_Cos'] = np.cos(2 * np.pi * df['DayOfYear'] / 365)
        df = df.sort_values('Date')
        df['SWDWN_7d_avg'] = df['ALLSKY_SFC_SW_DWN'].rolling(window=7, min_periods=1).mean()
        df['SWDWN_30d_avg'] = df['ALLSKY_SFC_SW_DWN'].rolling(window=30, min_periods=1).mean()
        df['T2M_7d_avg'] = df['T2M'].rolling(window=7, min_periods=1).mean()
        _cache[cache_key] = df
        return df
    except Exception:
        _cache[cache_key] = None
        return None

def get_soil_texture(lat: float, lon: float) -> float:
    """Fetch soil texture class from GEE."""
    cache_key = _generate_cache_key(lat, lon, "soil_texture")
    if cache_key in _cache:
        return _cache[cache_key]

    try:
        soil_value = ee.Image("OpenLandMap/SOL/SOL_TEXTURE-CLASS_USDA-TT_M/v02") \
            .select('b0') \
            .reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=ee.Geometry.Point([lon, lat]),
                scale=30
            ).get('b0').getInfo()
        result = 0.0 if soil_value is None or soil_value < 0 else min(soil_value / 100, 1.0)
        _cache[cache_key] = result
        return result
    except Exception:
        _cache[cache_key] = 0.0
        return 0.0

def get_slope(lat: float, lon: float) -> float:
    """Fetch slope from GEE SRTM dataset."""
    cache_key = _generate_cache_key(lat, lon, "slope")
    if cache_key in _cache:
        return _cache[cache_key]

    try:
        slope_value = ee.Terrain.slope(ee.Image("USGS/SRTMGL1_003")) \
            .reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=ee.Geometry.Point([lon, lat]),
                scale=30
            ).get('slope').getInfo()
        result = 0.0 if slope_value is None or slope_value < 0 else min(slope_value / 45, 1.0)
        _cache[cache_key] = result
        return result
    except Exception:
        _cache[cache_key] = 0.0
        return 0.0

def get_ndvi_data(lat: float, lon: float, radius: float = 2000) -> Optional[Dict[str, float]]:
    """Fetch NDVI-based land cover data from GEE Sentinel-2."""
    cache_key = _generate_cache_key(lat, lon, f"ndvi_{radius}")
    if cache_key in _cache:
        return _cache[cache_key]

    try:
        point = ee.Geometry.Point([lon, lat])
        region = point.buffer(radius)
        s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED") \
            .filterBounds(region) \
            .filterDate('2020-01-01', '2023-12-31') \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 5)) \
            .select(['B8', 'B4']) \
            .median()
        ndvi = s2.normalizedDifference(['B8', 'B4']).rename('NDVI')
        green_zone = ndvi.gt(0.4)
        barren_zone = ndvi.lt(0.2)
        green_buffer = green_zone.focal_max(radius=500, units='meters')
        afforestation_area = barren_zone.And(green_buffer)
        green = green_zone.reduceRegion(
            reducer=ee.Reducer.mean(), geometry=region, scale=30, maxPixels=1e9
        ).get('NDVI').getInfo()
        barren = barren_zone.reduceRegion(
            reducer=ee.Reducer.mean(), geometry=region, scale=30, maxPixels=1e9
        ).get('NDVI').getInfo()
        potential = afforestation_area.reduceRegion(
            reducer=ee.Reducer.mean(), geometry=region, scale=30, maxPixels=1e9
        ).get('NDVI').getInfo()
        result = {
            "green_cover": green if green is not None else 0.0,
            "barren_cover": barren if barren is not None else 0.0,
            "afforestation_potential": potential if potential is not None else 0.0
        }
        _cache[cache_key] = result
        return result
    except Exception:
        _cache[cache_key] = None
        return None
