from pydantic import BaseModel
from data_loader import get_ndvi_data

class LocationInput(BaseModel):
    latitude: float
    longitude: float

def analyze_afforestation(input_data: LocationInput):
    lat = input_data.latitude
    lon = input_data.longitude
    radius = 5000  # 5 km radius

    try:
        ndvi_data = get_ndvi_data(lat, lon, radius)
        if ndvi_data is None:
            return {"message": "❌ No cloud-free Sentinel-2 imagery available or error occurred."}

        green = ndvi_data["green_cover"]
        barren = ndvi_data["barren_cover"]
        potential = ndvi_data["afforestation_potential"]

        if None in (green, barren, potential):
            return {"message": "❌ Could not compute NDVI values accurately."}

        result = {
            "green_cover_percent": round(green * 100, 2),
            "barren_land_percent": round(barren * 100, 2),
            "afforestation_potential_percent": round(potential * 100, 2)
        }

        if green > 0.2 and potential > 0.1:
            result["feasibility"] = "✅ Afforestation is feasible in this area."
        else:
            result["feasibility"] = "🚫 Afforestation is NOT feasible in this area."

        return result
    except Exception as e:
        return {"message": f"⚠️ Error: {str(e)}"}