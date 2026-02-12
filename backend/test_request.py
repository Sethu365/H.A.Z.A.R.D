import requests

# Match scaler.n_features_in_ from predict.py
INPUT_DIM = 78  

# Generate dummy test data
features = [i / 100 for i in range(INPUT_DIM)]

url = "http://localhost:5001/predict"
response = requests.post(url, json={"features": features})

print("Status Code:", response.status_code)
print("Response:", response.json())
