// script.js
const video = document.getElementById('camera');
const photoElement = document.getElementById('photo');
const photoContainer = document.getElementById('photoContainer');
const countdownContainer = document.getElementById('countdownContainer');
const countdownText = document.getElementById('countdownText');
const countdownElement = document.getElementById('countdown');
const nextButton = document.getElementById('nextButton');
let isScanning = true;

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
    await video.play();
    requestAnimationFrame(tick);
}

function tick() {
    if (isScanning && video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            console.log("Data QR code:", code.data); // Debug: Tampilkan data QR code di console

            // Mulai hitungan mundur sebelum mengambil foto
            startCountdown(code);
            isScanning = false; // Menghentikan proses scanning
        }
    }

    if (isScanning) {
        requestAnimationFrame(tick); // Lanjutkan loop hanya jika masih scanning
    }
}

function startCountdown(code) {
    // Tampilkan tulisan "Memulai hitungan mundur..."
    countdownContainer.style.display = 'block';
    countdownText.textContent = 'Memulai hitungan mundur...';
    countdownElement.textContent = '';

    // Tunggu 2 detik sebelum memulai hitungan mundur
    setTimeout(() => {
        countdownText.textContent = ''; // Sembunyikan tulisan
        let count = 5; // Hitungan mundur dari 5
        countdownElement.textContent = count; // Tampilkan hitungan awal

        const countdownInterval = setInterval(() => {
            count--;
            countdownElement.textContent = count; // Perbarui tampilan hitungan

            if (count === 0) {
                clearInterval(countdownInterval); // Hentikan hitungan mundur
                countdownContainer.style.display = 'none'; // Sembunyikan hitungan mundur

                // Ambil foto setelah hitungan selesai
                takePhoto(code);
            }
        }, 1000); // Update setiap 1 detik
    }, 2000); // Tunggu 2 detik sebelum memulai hitungan mundur
}

function takePhoto(code) {
    // Buat canvas baru untuk mengambil gambar dari video
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Konversi canvas ke data URL (format gambar)
    const photoDataUrl = canvas.toDataURL('image/png');
    photoElement.src = photoDataUrl; // Tampilkan foto di pop-up

    // Tampilkan pop-up
    photoContainer.style.display = 'block';

    // Parsing data dari URL Google Form
    try {
        const url = new URL(code.data);
        const searchParams = new URLSearchParams(url.search);

        // Ambil data dari parameter URL
        const kodeUnik = searchParams.get('entry.1473065138'); // Kode Unik
        const nama = searchParams.get('entry.248739177'); // Nama
        const kelas = searchParams.get('entry.385545390'); // Kelas
        const noHp = searchParams.get('entry.1564877205'); // Nomor HP

        // Jika semua data ada, kirim ke Google Sheets
        if (kodeUnik && nama && kelas && noHp) {
            const waktuScan = new Date().toLocaleString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }); // Format tanggal dan waktu: DD/MM/YYYY, HH:MM:SS

            // Kirim data dan foto ke Google Sheets
            sendDataToGoogleSheets({
                waktuScan: waktuScan,
                kodeUnik: kodeUnik.toString(), // Pastikan kodeUnik adalah string
                nama: nama,
                kelas: kelas,
                noHp: noHp.toString(), // Pastikan noHp adalah string
                photo: photoDataUrl // Kirim foto baru sebagai data URL
            });
        }
    } catch (error) {
        console.error("Error parsing URL:", error);
    }
}

function sendDataToGoogleSheets(data) {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyaSJKSFbMVUtZjeoSXSbKnmEKanE2kf6sg81lSj54Fuk2syyYco65w9UmQn7feoKQI/exec';
    console.log("Data yang dikirim ke Google Sheets:", data); // Debug: Tampilkan data yang dikirim

    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data), // Kirim data dalam bentuk JSON
    })
    .then(response => response.text())
    .then(data => {
        console.log('Success:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Event listener untuk tombol "Next"
nextButton.addEventListener('click', () => {
    location.reload(); // Refresh halaman
});

setupCamera();