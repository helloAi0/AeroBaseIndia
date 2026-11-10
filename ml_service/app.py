import os
import re
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from sklearn.ensemble import RandomForestRegressor

app = Flask(__name__)

# Base directory for persisted models
DATA_DIR = "/data"
DEFAULT_MODEL_NAME = "DEFAULT_model.pkl"
TRAINING_DATA_PATH = os.path.join(DATA_DIR, "training_data.csv")

def retrain_model():
    """
    Nightly Retraining Pipeline Logic
    Trains the generic default model from the shared dataset.
    """
    print("Starting Nightly Retraining Pipeline...")
    
    if not os.path.exists(TRAINING_DATA_PATH):
        return False, "Training data not found at " + TRAINING_DATA_PATH

    try:
        df = pd.read_csv(TRAINING_DATA_PATH)
        X = df[['weather_condition', 'terminal_congestion_level']]
        y = df['delay_minutes']
        
        model = RandomForestRegressor(n_estimators=100)
        model.fit(X, y)
        score = model.score(X, y)
        
        if score > 0.70:
            target_path = os.path.join(DATA_DIR, DEFAULT_MODEL_NAME)
            temp_path = target_path + ".tmp"
            joblib.dump(model, temp_path)
            os.replace(temp_path, target_path)
            return True, score
        return False, f"Score too low: {score}"
            
    except Exception as e:
        return False, str(e)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy", 
        "service": "AeroBase-ML-MultiTenant",
        "storage_ready": os.path.exists(DATA_DIR)
    }), 200

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        # 1. Identity the Tenant
        tenant_id = str(data.get("tenant_id", "DEFAULT"))
        # tenant_id becomes part of a file path: allow only safe characters
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,32}", tenant_id):
            return jsonify({"error": "Invalid tenant_id"}), 400
        
        # 2. Extract features
        features = [[
            float(data.get("weather_score", 0)),
            float(data.get("congestion_score", 0))
        ]]
        
        # 3. Dynamic Model Selection
        model_path = os.path.join(DATA_DIR, f"{tenant_id}_model.pkl")
        default_path = os.path.join(DATA_DIR, DEFAULT_MODEL_NAME)
        
        model_used = "none"
        
        if os.path.exists(model_path):
            # Use specific tenant model
            model = joblib.load(model_path)
            prediction = model.predict(features)
            delay = int(prediction[0])
            model_used = f"{tenant_id}_model"
        elif os.path.exists(default_path):
            # Fallback to generic national model
            model = joblib.load(default_path)
            prediction = model.predict(features)
            delay = int(prediction[0])
            model_used = "DEFAULT_model"
        else:
            # Hardcoded Fallback Logic (if no models are trained yet)
            delay = int(features[0][0] * 1.5 + features[0][1] * 2.0)
            model_used = "heuristic_fallback"

        return jsonify({
            "predicted_delay_minutes": delay,
            "tenant_id": tenant_id,
            "model_used": model_used,
            "status": "success"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/retrain", methods=["POST"])
def trigger_retrain():
    success, result = retrain_model()
    if success:
        return jsonify({"status": "success", "r2_score": result}), 200
    return jsonify({"status": "failed", "reason": result}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)