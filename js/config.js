/* ============================================================
 * KONFIGURASI FRONTEND
 * Isi API_URL dengan URL Web App Google Apps Script (berakhiran /exec)
 * Biarkan KOSONG untuk mode DEMO (data contoh tersimpan di browser).
 * Tidak ada rahasia di sini — hanya URL publik.
 * ============================================================ */
window.APP_CONFIG = {
  API_URL: "",                 // contoh: "https://script.google.com/macros/s/AKfycb.../exec"
  NAMA_DEFAULT: "Aura Digital",
  WA_DEFAULT: "6281234567890", // dipakai hanya bila Pengaturan belum terisi
  CACHE_MENIT: 30              // data landing ditampilkan dari cache lalu diperbarui di latar belakang
};
