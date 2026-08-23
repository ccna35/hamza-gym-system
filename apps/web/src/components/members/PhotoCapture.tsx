import { Camera, CameraOff, ImagePlus, RefreshCcw } from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

export function PhotoCapture({
  value,
  onChange,
}: {
  value: Blob | null;
  onChange: (value: Blob | null) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  useEffect(() => () => stream.current?.getTracks().forEach((track) => track.stop()), []);

  const stopCamera = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setCameraOpen(false);
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      stream.current = media;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (video.current) {
          video.current.srcObject = media;
          void video.current.play();
        }
      });
    } catch {
      setCameraError('تعذر تشغيل الكاميرا. يمكنك اختيار صورة من الجهاز بدلاً منها.');
      stopCamera();
    }
  };

  const capture = () => {
    const source = video.current;
    if (!source || !source.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = source.videoWidth;
    canvas.height = source.videoHeight;
    canvas.getContext('2d')?.drawImage(source, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) onChange(blob);
        stopCamera();
      },
      'image/jpeg',
      0.9,
    );
  };

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setCameraError('حجم الصورة يتجاوز 5 ميجابايت.');
      return;
    }
    setCameraError('');
    onChange(file);
  };

  return (
    <fieldset className="sm:col-span-2">
      <legend className="font-medium">
        صورة العضو <span className="text-sm font-normal text-[#68736b]">(اختيارية)</span>
      </legend>
      <div className="mt-2 overflow-hidden rounded-xl border border-dashed border-[#bdb5a7] bg-[#f7f4ed] p-3">
        {cameraOpen ? (
          <div>
            <video
              autoPlay
              className="aspect-video w-full rounded-lg bg-black object-cover"
              muted
              playsInline
              ref={video}
            />
            <div className="mt-3 flex gap-2">
              <button
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#315c45] px-4 font-semibold text-white"
                onClick={capture}
                type="button"
              >
                <Camera size={18} />
                التقاط الصورة
              </button>
              <button
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#c7bfb1] px-4"
                onClick={stopCamera}
                type="button"
              >
                <CameraOff size={18} />
                إلغاء
              </button>
            </div>
          </div>
        ) : preview ? (
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <img
              alt="معاينة صورة العضو"
              className="size-28 rounded-xl object-cover"
              src={preview}
            />
            <div>
              <p className="font-semibold">الصورة جاهزة للرفع</p>
              <button
                className="mt-2 flex min-h-11 items-center gap-2 rounded-lg border border-[#c7bfb1] px-4"
                onClick={() => onChange(null)}
                type="button"
              >
                <RefreshCcw size={17} />
                اختيار صورة أخرى
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#e2ebe3] px-4 font-semibold text-[#315c45]"
              onClick={startCamera}
              type="button"
            >
              <Camera size={18} />
              فتح كاميرا الويب
            </button>
            <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#c7bfb1] bg-white px-4 font-semibold">
              <ImagePlus size={18} />
              اختيار صورة أو الكاميرا
              <input
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                className="sr-only"
                onChange={choose}
                type="file"
              />
            </label>
          </div>
        )}
        {cameraError && (
          <p className="mt-3 text-sm text-[#8b382c]" role="alert">
            {cameraError}
          </p>
        )}
      </div>
    </fieldset>
  );
}
