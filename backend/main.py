import os, time, requests, cv2
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sarvamai import SarvamAI
import pandas as pd

load_dotenv()

df = pd.read_csv("braille.csv")
TELUGU_TO_BRAILLE = dict(zip(df["Telugu_char"], df["Braille_char"]))

app = FastAPI(title="Telugu OCR, TTS & Braille API")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

api_key = os.getenv("SARVAM_API_KEY")
if not api_key:
    raise RuntimeError("SARVAM_API_KEY is not set in the .env file.")

client = SarvamAI(api_subscription_key=api_key)


class TTSRequest(BaseModel):
    text: str
    target_language_code: str = "te-IN"
    speaker: str = "shubh_enhi_ads"
    model: str = "bulbul:v4-flash"


class BrailleRequest(BaseModel):
    text: str


def text_to_braille(text: str) -> str:
    return "".join([str(TELUGU_TO_BRAILLE.get(char, char)) for char in text])


@app.get("/capture-image")
async def capture_image():
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

    if not cap.isOpened():
        cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        raise HTTPException(status_code=500, detail="Could not open webcam.")

    captured_frame = None
    window_name = "Live Feed (Press ENTER to capture, ESC to cancel)"

    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.setWindowProperty(window_name, cv2.WND_PROP_TOPMOST, 1)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        cv2.imshow(window_name, frame)

        key = cv2.waitKey(1)
        if key == 13:  # Enter key
            captured_frame = frame
            break
        elif key == 27:  # Esc key
            break

    cap.release()
    cv2.destroyAllWindows()

    if captured_frame is None:
        raise HTTPException(status_code=400, detail="Capture cancelled.")

    success, buffer = cv2.imencode(".jpg", captured_frame)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to process captured image.")

    return Response(content=buffer.tobytes(), media_type="image/jpeg")


@app.post("/generate-audio")
async def generate_audio(request: TTSRequest):
    try:
        audio_stream = client.text_to_speech.convert_stream(
            text=request.text,
            language_code=request.target_language_code,
            speaker=request.speaker,
            model=request.model,
        )

        def stream_generator():
            for chunk in audio_stream:
                yield chunk

        return StreamingResponse(stream_generator(), media_type="audio/mpeg", headers={"Content-Disposition": "inline; filename=speech.mp3"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/convert-braille")
async def convert_braille(request: BrailleRequest):
    try:
        return {"braille": text_to_braille(request.text)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    try:
        url = "https://api.sarvam.ai/doc-ai/v1/job/digitise"
        headers = {"api-subscription-key": api_key}

        file_bytes = await file.read()
        files = {"file": (file.filename, file_bytes, file.content_type)}
        data = {"language": "te-IN"}

        start_resp = requests.post(url, headers=headers, files=files, data=data)
        start_resp.raise_for_status()
        job_id = start_resp.json()["job_id"]

        status_url = f"https://api.sarvam.ai/doc-ai/v1/job/{job_id}/status"
        while True:
            status_resp = requests.get(status_url, headers=headers)
            status_resp.raise_for_status()
            status = status_resp.json()["status"]

            if status == "completed":
                break
            elif status in ["failed", "rejected"]:
                raise HTTPException(status_code=500, detail="OCR Job failed.")
            time.sleep(2)

        results_url = f"https://api.sarvam.ai/doc-ai/v1/job/{job_id}/results"
        results_resp = requests.get(results_url, headers=headers)
        results_resp.raise_for_status()
        results_data = results_resp.json()

        def parse_texts(obj):
            texts = []
            if isinstance(obj, dict):
                if "text" in obj and isinstance(obj["text"], str):
                    texts.append(obj["text"])
                else:
                    for v in obj.values():
                        texts.extend(parse_texts(v))
            elif isinstance(obj, list):
                for item in obj:
                    texts.extend(parse_texts(item))
            return texts

        extracted_text = "\n".join(parse_texts(results_data)).strip()
        return {"text": extracted_text, "braille": text_to_braille(extracted_text)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
