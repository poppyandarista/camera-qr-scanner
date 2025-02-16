const video = document.getElementById('camera');
const photoElement = document.getElementById('photo');
const namaElement = document.getElementById('nama')
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
            console.log("Data QR code:", code.data);

            startCountdown(code);
            isScanning = false;
        }
    }

    if (isScanning) {
        requestAnimationFrame(tick);
    }
}

function startCountdown(code) {
    countdownContainer.style.display = 'block';
    countdownText.textContent = 'Memulai hitungan mundur...';
    countdownElement.textContent = '';

    setTimeout(() => {
        countdownText.textContent = '';
        let count = 5;
        countdownElement.textContent = count;

        const countdownInterval = setInterval(() => {
            count--;
            countdownElement.textContent = count;

            if (count === 0) {
                clearInterval(countdownInterval);
                countdownContainer.style.display = 'none';

                takePhoto(code);
            }
        }, 1000);
    }, 2000);
}

function takePhoto(code) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photoDataUrl = canvas.toDataURL('image/png');
    photoElement.src = photoDataUrl;

    photoContainer.style.display = 'block';

    try {
        const url = new URL(code.data);
        const searchParams = new URLSearchParams(url.search);

        const kodeUnik = searchParams.get('entry.1883684488');
        const nama = searchParams.get('entry.1028027445');
        const kelas = searchParams.get('entry.1688765742');
        const noHp = searchParams.get('entry.797715333');
        const keterangan = searchParams.get('entry.1393924849');

        namaElement.textContent = nama;

        if (kodeUnik && nama && kelas && noHp && keterangan) {
            const waktuScan = new Date().toLocaleString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            sendDataToGoogleSheets({
                waktuScan: waktuScan,
                kodeUnik: kodeUnik.toString(),
                nama: nama,
                kelas: kelas,
                noHp: noHp.toString(),
                keterangan: keterangan,
                photo: photoDataUrl
            });
        }
    } catch (error) {
        console.error("Error parsing URL:", error);
    }
}

function sendDataToGoogleSheets(data) {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbxQVY09ftv71R030Npa981Qea3Tgqr9qmOGu8ug2x1Ye8Zsrr9ptLNNGqFhqxAt4-8Qxw/exec';
    console.log("Data yang dikirim ke Google Sheets:", data);

    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.text())
    .then(data => {
        console.log('Success:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

nextButton.addEventListener('click', () => {
    location.reload();
});

setupCamera();