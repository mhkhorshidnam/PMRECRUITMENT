import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import requests # برای ارسال درخواست‌های HTTP به n8n
import json # برای کار با JSON
import fitz # PyMuPDF برای OCR (اگرچه در n8n استفاده نخواهد شد)

app = Flask(__name__)

# --- تنظیمات ---
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
N8N_WEBHOOK_URL_AI_PROCESSING = 'http://localhost:5678/webhook/ai-process-resume' 

# اطمینان از وجود پوشه آپلود
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # 16 MB max upload size

# تنظیمات پایه‌ای CORS برای اجازه درخواست‌ها از سایت GitHub Pages شما
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*') 
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/')
def home():
    return "Backend is running!"

@app.route('/upload_and_analyze', methods=['POST'])
def upload_and_analyze():
    if 'resume' not in request.files:
        return jsonify({"status": "error", "message": "No resume file part in the request"}), 400

    file = request.files['resume']
    candidate_name = request.form.get('candidate_name', 'Unnamed Candidate')

    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400

    # اگر فایل وجود دارد و نام آن خالی نیست
    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path) # ذخیره فایل رزومه به صورت موقت

        extracted_text = ""
        try:
            # --- انجام OCR در Flask ---
            if filename.lower().endswith('.pdf'):
                doc = fitz.open(file_path)
                for page in doc:
                    extracted_text += page.get_text()
                doc.close()
            elif filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                extracted_text = "Image file detected. OCR for images requires additional setup in Flask (Tesseract). Please upload PDF."
            else:
                extracted_text = "Unsupported file type. Please upload PDF, JPG, or PNG."

            if not extracted_text or "Error" in extracted_text: # Handle cases where OCR failed or returned error message
                return jsonify({"status": "error", "message": f"OCR failed or returned empty text: {extracted_text}"}), 500

        except Exception as e:
            return jsonify({"status": "error", "message": f"OCR processing failed in Flask: {e}"}), 500
        finally:
            # Optionally, delete the uploaded file after processing to save space
            # os.remove(file_path) 
            pass # بلاک finally باید حتماً چیزی داشته باشد


        # --- ارسال متن استخراج شده به n8n برای پردازش هوش مصنوعی ---
        try:
            n8n_payload = {
                "candidateName": candidate_name,
                "extractedText": extracted_text, # ارسال متن استخراج شده به جای مسیر فایل
                "fileName": filename
            }

            response_from_n8n = requests.post(N8N_WEBHOOK_URL_AI_PROCESSING, json=n8n_payload)
            response_from_n8n.raise_for_status() 

            ai_analysis_results = response_from_n8n.json()

            return jsonify({
                "status": "success",
                "message": "Resume uploaded and AI processing completed successfully.",
                "candidateName": candidate_name,
                "aiAnalysis": ai_analysis_results 
            }), 200

        except requests.exceptions.RequestException as e:
            return jsonify({"status": "error", "message": f"Failed to communicate with n8n for AI analysis: {e}"}), 500
        except json.JSONDecodeError:
            return jsonify({"status": "error", "message": "Received invalid JSON from n8n for AI analysis"}), 500
        except Exception as e:
            return jsonify({"status": "error", "message": f"An unexpected error during n8n/AI communication: {e}"}), 500

    # اگر فایل وجود نداشت یا نامش خالی بود، به اینجا می‌رسیم.
    # این return در داخل تابع upload_and_analyze() قرار دارد.
    return jsonify({"status": "error", "message": "Something went wrong with file upload or processing."}), 400


if __name__ == '__main__':
    try:
        app.run(debug=True, port=5000)
    except Exception as e:
        print(f"خطا در راه‌اندازی اپلیکیشن Flask: {e}")
        print("لطفاً تنظیمات، دسترسی‌ها، یا استفاده شدن پورت توسط برنامه دیگری را بررسی کنید.")