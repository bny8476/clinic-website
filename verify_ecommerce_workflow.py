import urllib.request
import json

BASE_URL = "http://localhost:8080/api"

def login(portal, email, password):
    url = f"{BASE_URL}/auth/{portal}/login"
    payload = json.dumps({"email": email, "password": password}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            token = data.get("accessToken") or data.get("token")
            print(f"[{portal.upper()} LOGIN SUCCESS] Token obtained for {email}")
            return token
    except Exception as e:
        print(f"[{portal.upper()} LOGIN FAILED]: {e}")
        return None

def api_request(url, method="GET", token=None, body=None):
    req_url = f"{BASE_URL}{url}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    data = json.dumps(body).encode('utf-8') if body else None
    req = urllib.request.Request(req_url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"[API ERROR {e.code}] {url} -> {err_body}")
        raise e

def run_test():
    print("=== STARTING END-TO-END MEDICINE E-COMMERCE WORKFLOW TEST ===")
    
    # 1. Doctor Login
    doctor_token = login("doctor", "doctor@clinic.com", "Clinic@2026#Doctor")
    assert doctor_token, "Doctor login failed"

    # 2. Doctor Adds New Medicine (Medicine Master)
    medicine_dto = {
        "medicineName": "Paracetamol 500mg Super",
        "genericName": "Paracetamol",
        "brandName": "SuperPara",
        "manufacturer": "Apex Healthcare",
        "category": "Tablet",
        "dosageForm": "Tablet",
        "strength": "500 mg",
        "packSize": "Strip of 10",
        "price": 45.00,
        "stockQuantity": 100,
        "description": "Fast action pain relief and fever reduction.",
        "prescriptionRequired": False,
        "status": "ACTIVE"
    }
    
    print("\n--- Step 1: Doctor Adding New Medicine to Master & E-commerce ---")
    created_med = api_request("/doctor/medicines", method="POST", token=doctor_token, body=medicine_dto)
    print(f"[SUCCESS] Created Medicine ID: {created_med.get('id')}, Name: '{created_med.get('medicineName')}', Price: ₹{created_med.get('price')}, Stock: {created_med.get('stockQuantity')}")
    med_id = created_med['id']

    # 3. Doctor Views Managed Medicines List
    doctor_meds = api_request("/doctor/medicines", method="GET", token=doctor_token)
    print(f"[SUCCESS] Doctor manages {len(doctor_meds)} active medicines.")

    # 4. Patient Login
    print("\n--- Step 2: Patient Browsing & E-commerce Catalog ---")
    patient_token = login("patient", "patient@clinic.com", "Clinic@2026#Patient")
    assert patient_token, "Patient login failed"

    # 5. Patient Catalog Search & Details
    catalog = api_request("/medicines", method="GET", token=patient_token)
    items = catalog.get("content", catalog) if isinstance(catalog, dict) else catalog
    found_item = next((item for item in items if item.get("id") == med_id), None)
    assert found_item, "Created medicine not found in Patient Marketplace!"
    name_display = found_item.get('medicineName') or found_item.get('name')
    print(f"[SUCCESS] Patient Marketplace contains '{name_display}' at ₹{found_item['price']}")

    med_details = api_request(f"/medicines/{med_id}", method="GET", token=patient_token)
    print(f"[SUCCESS] Opened Medicine Details Page for ID {med_id}: {med_details.get('medicineName')} - {med_details.get('strength')}")

    # 6. Patient Places Order
    print("\n--- Step 3: Patient Order Placement & Inventory Deduction ---")
    order_dto = {
        "shippingAddress": "123 Healthcare Ave, Block B, Metro City",
        "shippingCity": "Metro City",
        "postalCode": "110001",
        "patientName": "John Patient",
        "phone": "+919876543210",
        "prescriptionNotes": "Please deliver before 6 PM.",
        "items": [
            {
                "medicineId": med_id,
                "quantity": 2
            }
        ]
    }
    
    placed_order = api_request("/orders", method="POST", token=patient_token, body=order_dto)
    order_id = placed_order['orderId']
    order_number = placed_order.get('orderNumber')
    print(f"[SUCCESS] Order Placed! Order ID: {order_id}, Order Number: {order_number}, Total Amount: ₹{placed_order['totalAmount']}, Status: {placed_order['status']}")

    # Verify inventory stock deduction
    med_after_order = api_request(f"/medicines/{med_id}", method="GET", token=patient_token)
    print(f"[SUCCESS] Stock automatically reduced from 100 to {med_after_order['stockQuantity']} (2 items purchased)")
    assert med_after_order['stockQuantity'] == 98, f"Expected stock 98, got {med_after_order['stockQuantity']}"

    # 7. Doctor Views Received Order & Fulfills Order
    print("\n--- Step 4: Doctor Order Notification, Fulfillment & Status Progression ---")
    doc_orders = api_request("/doctor/orders", method="GET", token=doctor_token)
    matching_doc_order = next((o for o in doc_orders if o.get('id') == order_id or o.get('orderId') == order_id), None)
    assert matching_doc_order, f"Order {order_id} not visible in Doctor Orders Portal!"
    print(f"[SUCCESS] Doctor sees Order {order_number} from Patient: {matching_doc_order.get('patientName')} (ID: {matching_doc_order.get('patientId')})")

    # Doctor confirms order
    updated_doc_order = api_request(f"/doctor/orders/{order_id}/status?status=CONFIRMED", method="PATCH", token=doctor_token)
    print(f"[SUCCESS] Doctor updated order status to: {updated_doc_order.get('status')}")

    # 8. Patient Tracks Order & Timeline
    print("\n--- Step 5: Patient Order Tracking ---")
    patient_orders = api_request("/orders/my", method="GET", token=patient_token)
    my_order = next((o for o in patient_orders if o.get('id') == order_id or o.get('orderId') == order_id), None)
    assert my_order, "Order missing from patient's my orders list!"
    print(f"[SUCCESS] Patient sees Order {my_order.get('orderNumber', order_number)} status updated to: {my_order['status']}")

    print("\n=======================================================")
    print(" ALL END-TO-END E-COMMERCE WORKFLOW TESTS PASSED 100%! ")
    print("=======================================================")

if __name__ == "__main__":
    run_test()
