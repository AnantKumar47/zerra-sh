from pydantic import BaseModel
from data_loader import get_nasa_rainfall_data, get_soil_texture, get_slope

class LocationInput(BaseModel):
    latitude: float
    longitude: float

def calculate_water_harvesting_score(input_data: LocationInput):
    lat = input_data.latitude
    lon = input_data.longitude

    rainfall_score = get_nasa_rainfall_data(lat, lon)
    soil_score = get_soil_texture(lat, lon)
    slope_score = get_slope(lat, lon)

    final_score = (0.5 * rainfall_score) + (0.3 * soil_score) + (0.2 * slope_score)

    if final_score >= 0.6:
        feasibility = "✅ Water harvesting is feasible in this area."
    elif final_score >= 0.4:
        feasibility = "⚠️ Water harvesting may be moderately feasible."
    else:
        feasibility = "🚫 Water harvesting is not feasible in this area."

    return {
        "rainfall_score": round(rainfall_score, 2),
        "soil_score": round(soil_score, 2),
        "slope_score": round(slope_score, 2),
        "water_harvesting_score": round(final_score, 2),
        "feasibility": feasibility
    }