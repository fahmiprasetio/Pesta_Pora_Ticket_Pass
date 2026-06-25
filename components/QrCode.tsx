/* eslint-disable @next/next/no-img-element */

// QR code via layanan render gratis (tanpa menambah paket npm). Mengencode
// URL/teks apa pun jadi gambar PNG hitam-putih yang aman untuk dicetak.
export default function QrCode({
  value,
  size = 200,
}: {
  value: string;
  size?: number;
}) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&qzone=1&data=${encodeURIComponent(
    value
  )}`;
  return (
    <img
      src={src}
      alt="QR code verifikasi tiket"
      width={size}
      height={size}
      className="block h-auto rounded-lg bg-paper"
    />
  );
}
