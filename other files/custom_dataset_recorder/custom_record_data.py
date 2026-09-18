import cv2
import time
from pathlib import Path

def record_single_video(cap, class_name: str, video_index: int, total_videos: int, record_seconds: int, fps: int, target_dir: Path):
    filename = target_dir / f"{class_name}_{video_index}.mp4"

    if not cap.isOpened():
        print("Webcam not accessible.")
        return False

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(filename), fourcc, fps, (width, height))

    countdown_seconds = 3

    # Countdown
    countdown_start = time.time()
    while True:
        elapsed = time.time() - countdown_start
        remaining = countdown_seconds - int(elapsed)
        
        if remaining <= 0:
            break

        ret, frame = cap.read()
        if not ret:
            break

        cv2.putText(
            frame,
            f"Recording starts in {remaining}",
            (50, 100),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.2,
            (0, 0, 255),
            3
        )

        cv2.imshow("Recording", frame)
        cv2.waitKey(1)

    print(f"Recording video {video_index}...")

    start_time = time.time()

    while int(time.time() - start_time) < record_seconds:
        ret, frame = cap.read()
        if not ret:
            break

        out.write(frame)

        cv2.putText(
            frame,
            f"{class_name} | {video_index}/{total_videos}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"Time: {int(time.time() - start_time) + 1}/{record_seconds}s",
            (20, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 0),
            2
        )

        cv2.imshow("Recording", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            print("Recording interrupted by user.")
            out.release()
            return False

    out.release()

    print(f"Saved: {filename}")
    return True


def main():
    print("--- Custom Video Dataset Recorder ---")
    
    sentence = input("Enter the sentence/label for the dataset: ").strip()
    if not sentence:
        print("Sentence cannot be empty.")
        return
        
    try:
        duration = int(input("Enter video duration (in seconds): "))
        if duration <= 0:
            raise ValueError
    except ValueError:
        print("Invalid duration. Must be a positive integer.")
        return
        
    try:
        num_videos = int(input("Enter number of videos to record: "))
        if num_videos <= 0:
            raise ValueError
    except ValueError:
        print("Invalid number of videos. Must be a positive integer.")
        return
        
    base_dir = Path(__file__).resolve().parent
    dataset_dir = base_dir / "dataset" / sentence
    dataset_dir.mkdir(parents=True, exist_ok=True)
    
    existing_files = list(dataset_dir.glob("*.mp4"))
    start_index = len(existing_files) + 1
    
    fps = 20
    
    print(f"\nConfiguration:")
    print(f"Label: {sentence}")
    print(f"Duration: {duration} seconds per video")
    print(f"Total Videos: {num_videos}")
    print(f"Saving to: {dataset_dir}")
    print("\nPress 'q' during recording to stop.")
    input("Press Enter to start...")

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Failed to open webcam.")
        return

    for i in range(num_videos):
        success = record_single_video(
            cap=cap,
            class_name=sentence, 
            video_index=start_index + i, 
            total_videos=num_videos, 
            record_seconds=duration, 
            fps=fps, 
            target_dir=dataset_dir
        )
        
        if not success:
            print("Stopped recording process.")
            break
            
        if i < num_videos - 1:
            print("Next recording will start shortly...")
            sleep_start = time.time()
            while time.time() - sleep_start < 2:
                cap.read()
                cv2.waitKey(1)
            
    cap.release()
    cv2.destroyAllWindows()
    print("\nRecording session completed.")

if __name__ == "__main__":
    main()
