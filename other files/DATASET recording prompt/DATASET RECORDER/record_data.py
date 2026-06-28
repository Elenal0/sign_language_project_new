import cv2
import time
from pathlib import Path

from config import RAW_DATA_DIR, CLASSES


VIDEOS_PER_SESSION = 10
RECORD_SECONDS = 5
FPS = 20
COUNTDOWN_SECONDS = 3


def record_single_video(class_name: str, video_index: int):
    class_dir = RAW_DATA_DIR / class_name
    class_dir.mkdir(parents=True, exist_ok=True)

    filename = class_dir / f"{class_name}_{video_index}.mp4"

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Webcam not accessible.")
        return False

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(filename), fourcc, FPS, (width, height))

    # Countdown
    for i in range(COUNTDOWN_SECONDS, 0, -1):
        ret, frame = cap.read()
        if not ret:
            break

        cv2.putText(
            frame,
            f"Recording starts in {i}",
            (50, 100),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.2,
            (0, 0, 255),
            3
        )

        cv2.imshow("Recording", frame)
        cv2.waitKey(1000)

    print(f"Recording video {video_index}...")

    start_time = time.time()

    while int(time.time() - start_time) < RECORD_SECONDS:
        ret, frame = cap.read()
        if not ret:
            break

        out.write(frame)

        cv2.putText(
            frame,
            f"{class_name} | {video_index}/{VIDEOS_PER_SESSION}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"Time: {int(time.time() - start_time) + 1}/{RECORD_SECONDS}s",
            (20, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 0),
            2
        )

        cv2.imshow("Recording", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    out.release()
    cv2.destroyAllWindows()

    print(f"Saved: {filename}")
    return True


def main():
    print("\nAvailable Classes:\n")

    for idx, cls in enumerate(CLASSES):
        print(f"{idx} → {cls}")

    choice = input("\nEnter class number to record: ")

    try:
        choice = int(choice)
        class_name = CLASSES[choice]
    except:
        print("Invalid selection.")
        return

    class_dir = RAW_DATA_DIR / class_name
    class_dir.mkdir(parents=True, exist_ok=True)

    existing_files = list(class_dir.glob("*.mp4"))
    start_index = len(existing_files) + 1

    print(f"\nRecording {VIDEOS_PER_SESSION} videos for: {class_name}")
    print("Press 'q' anytime to stop.\n")

    for i in range(VIDEOS_PER_SESSION):
        success = record_single_video(class_name, start_index + i)
        if not success:
            break

        print("Next recording will start shortly...")
        time.sleep(2)

    print("\nRecording session completed.")


if __name__ == "__main__":
    main()