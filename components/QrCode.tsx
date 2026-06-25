/* eslint-disable @next/next/no-img-element */

// QR code rendered via a free render service (no extra npm package). Encodes
// any URL/text into a black-and-white PNG image that is safe to print.
export default function QrCode({
  value,
  size = 200,
}: {
  value: string;
  size?: number;
}) {
  const endpoint = "https://api.qrserver.com/v1/create-qr-code/";
  const dimension = `${size}x${size}`;
  const src = `${endpoint}?size=${dimension}&margin=0&qzone=1&data=${encodeURIComponent(
    value
  )}`;
  return (
    <img
      src={src}
      alt="Ticket verification QR code"
      width={size}
      height={size}
      className="block h-auto rounded-lg bg-paper"
    />
  );
}
