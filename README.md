# Telugu OCR, TTS & Braille Converter

A full-stack web application that allows users to extract Telugu text from documents or live camera feeds, convert that text into audible speech, and translate it into standard Bharati Braille format for accessibility.

Powered by **FastAPI**, **OpenCV**, and **Sarvam AI**.

## 🚀 Features

- **Document Digitization (OCR):** Upload image/PDF files or use your webcam to capture live images. Extracts Telugu text using Sarvam AI's Document Digitization API.
- **Live Camera Feed:** Integrated OpenCV webcam capture that opens instantly and stays on top of other windows for easy capturing.
- **Text-to-Speech (TTS):** Converts extracted or manually typed Telugu text into high-quality audio using Sarvam AI's TTS models. Plays directly in the browser.
- **Braille Translation:** Instantly converts Telugu text into Unicode Bharati Braille format.
- **BRF Export:** Download the translated Braille text as a `.brf` (Braille Ready Format) file, compatible with standard Braille printers and embossers.
- **Side-by-Side UI:** Clean, responsive frontend that lets you view your uploaded document right next to the extracted text.

## 🛠️ Technology Stack

- **Backend:** Python, FastAPI, Uvicorn, OpenCV (`cv2`), Requests, Pydantic
- **Frontend:** HTML5, CSS3 (Flexbox), Vanilla JavaScript (Fetch API)
- **AI Provider:** Sarvam AI Python SDK

## 📁 Project Structure

```text
Telugu_OCR/
│
├── backend/
│   ├── main.py              # FastAPI application & OpenCV logic
│   ├── braille.py           # Telugu to Bharati Braille mapping
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # API Keys (Create this file)
│
├── frontend/
│   ├── index.html           # Main UI structure
│   ├── style.css            # Styling and layout
│   └── script.js            # Frontend logic and API integration
│
└── README.md                # Project documentation
```

## ⚙️ Setup and Installation

### 1. Backend Setup

Navigate to the backend folder and install the required Python dependencies:

```bash
cd Telugu_OCR/backend
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder and add your Sarvam AI API key:

```env
SARVAM_API_KEY=your_actual_api_key_here
```

### 2. Run the Backend Server

Start the FastAPI server using Uvicorn. It will run locally on port 8000.

```bash
uvicorn main:app --reload
```

_Note: The backend must be running for the frontend to work._

### 3. Run the Frontend

Simply open your file explorer, navigate to the `Telugu_OCR/frontend/` folder, and double-click `index.html` to open it in your preferred web browser. No frontend build tools are required!

## 💡 How to Use

1. **Input an Image:**
    - Click **"Choose a File"** to upload a document from your computer.
    - OR click **"Capture live IMG"** to open your webcam. A window will pop up (staying on top of your browser). Press the **ENTER** key to take a picture, or **ESC** to cancel.
2. **Extract Text:** Click **"Upload & Extract Text"**. The app will process the image and display the Telugu text in the text box.
3. **Edit:** You can manually type or edit the text inside the text box at any time.
4. **Listen:** Click **"Generate Audio"** to hear the text read aloud.
5. **Convert to Braille:** Click **"Generate Braille"** to see the dot patterns.
6. **Download:** Click **"Download .BRF File"** to save the Braille output for embossing.

## ⚠️ Notes

- Allow camera permissions if prompted by your operating system for the OpenCV capture to work.
- Ensure you have a valid active subscription/API key from Sarvam AI for the OCR and TTS features.
