from pydantic import BaseModel
from data_loader import get_nasa_solar_data
from catboost import CatBoostRegressor
from sklearn.model_selection import train_test_split

class LocationInput(BaseModel):
    latitude: float
    longitude: float

def train_catboost(df):
    features = [
        'Year', 'Month', 'DayOfYear',
        'CLRSKY_SFC_SW_DWN', 'T2M',
        'Day_Sin', 'Day_Cos',
        'SWDWN_7d_avg', 'SWDWN_30d_avg', 'T2M_7d_avg'
    ]
    X = df[features]
    y = df['ALLSKY_SFC_SW_DWN']
    X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2, random_state=42)
    model = CatBoostRegressor(
        iterations=1500,
        learning_rate=0.03,
        depth=8,
        loss_function='RMSE',
        random_seed=42,
        early_stopping_rounds=50,
        verbose=False
    )
    model.fit(X_train, y_train)
    return model

def predict_solar(input_data: LocationInput):
    df = get_nasa_solar_data(input_data.latitude, input_data.longitude)
    if df is None:
        return {"message": "Failed to fetch NASA data."}

    model = train_catboost(df)
    target_year = 2024
    data_points = df[df['Year'] == target_year]
    if data_points.empty:
        return {"message": "No data available for the year 2024."}

    features = [
        'Year', 'Month', 'DayOfYear',
        'CLRSKY_SFC_SW_DWN', 'T2M',
        'Day_Sin', 'Day_Cos',
        'SWDWN_7d_avg', 'SWDWN_30d_avg', 'T2M_7d_avg'
    ]
    predictions = model.predict(data_points[features])
    yearly_average = max(0, predictions.mean())

    if yearly_average > 5.0:
        recommendation = "✅ Excellent potential! Installing solar is a great investment."
    elif 3.5 <= yearly_average <= 5.0:
        recommendation = "👍 Good potential. Solar installation is beneficial."
    elif 2.0 <= yearly_average < 3.5:
        recommendation = "⚠️ Moderate potential. Consider additional analysis before installation."
    else:
        recommendation = "❌ Low potential. Solar may not be a cost-effective option."

    return {
        "average_radiation": round(yearly_average, 3),
        "result": recommendation
    }