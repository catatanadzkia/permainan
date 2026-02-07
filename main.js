window.onload = () => {
    // 1. Ambil ID tersimpan
    const savedID = localStorage.getItem('lastSheetID');
    if (savedID && document.getElementById('sheet-id-input')) {
        document.getElementById('sheet-id-input').value = savedID;
    }

    // 2. Animasi Loader awal
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('setup-box').style.display = 'block';
    }, 1500);
};
const API_URL = "https://script.google.com/macros/s/AKfycbw_5OYmFFh23TBmrVdwCFX5x6CVkHBS9IFBx_2rtsJcSG6uP26zgn4JRJf5Sm9p3BXZtQ/exec";

let pos = 50, soal = [], totalSoal = 0, solvedP1 = 0, solvedP2 = 0, isProcessingP1 = false, isProcessingP2 = false;
let scoreP1 = 0, scoreP2 = 0;
let timer1, timer2, curA, curB;
let soalP1 = [], soalP2 = [];
let gameEnded = false;


function getSpreadsheetId(input) {
    if (!input) return null;
    if (!input.includes("docs.google.com")) return input.trim(); // Jika sudah ID, ambil langsung
    
    // Regex sakti untuk ambil ID di antara /d/ dan /edit
    const matches = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return (matches && matches[1]) ? matches[1] : null;
}
async function fetchDataSoal() {
    const inputID = document.getElementById('sheet-id-input').value.trim(); // ID dari guru (jika ada)
    const selectID = document.getElementById('kelas-select').value; // ID dari dropdown kelas
    const namaMapel = document.getElementById('mapel-select').value;

     let idInput = getSpreadsheetId(inputID);
    

    // LOGIKA DINAMIS:
    // 1. Jika guru isi inputID, pakai itu (Prioritas Utama).
    // 2. Jika inputID kosong, pakai selectID dari dropdown.
    let finalID = idInput ? idInput : selectID;

    // Validasi: Kalau dua-duanya kosong (belum pilih kelas & tidak isi input)
    if (!finalID) {
        showCustomAlert("PILIH KELAS", "Silakan pilih kelas atau masukkan ID Spreadsheet dulu, Bos!");
        return;
    }

    if (!namaMapel) {
        showCustomAlert("PILIH MAPEL", "Mata pelajarannya belum dipilih nih!");
        return;
    }

    // Simpan ke memori browser hanya jika guru mengetik ID kustom
    if (inputID) {
        localStorage.setItem('lastSheetID', inputID);
    }
    // Tampilkan loader lagi
    document.getElementById('setup-box').style.display = 'none';
    document.getElementById('loader').style.display = 'block';
    document.getElementById('loader-text').innerText = "Mengambil Soal " + namaMapel + "...";

    try {
        const response = await fetch(`${API_URL}?id=${finalID}&sheet=${namaMapel}`);
        const data = await response.json();
        let dataValid = data.filter(r => r[1] && r[2]);

        if (dataValid.length === 0) {
            showCustomAlert("SOAL KOSONG!", `Waduh, soal untuk ${namaMapel} belum diisi di Google Sheets.`);
            return;
        }

        // KOCOK SEKALIGUS DI SINI (Fisher-Yates)
        soalP1 = shuffle([...dataValid]);
        soalP2 = shuffle([...dataValid]);

        totalSoal = dataValid.length;
        solvedP1 = 0; 
        solvedP2 = 0;

        document.getElementById('loading-overlay').style.display = 'none';
        newSoal('P1'); 
        newSoal('P2');
        
    } catch (e) {
        showCustomAlert("NAMA SHEET", ` Gagal mengambil soal.\nGagal membaca Sheet "${namaMapel}" silakan tambahkan di googlesheet anda.`);
        // Kembalikan ke pilihan jika gagal
        
    }
}
// Fungsi pengocok murni (biar benar-benar acak)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
// ... Sisa fungsi check(), newSoal(), startTimer() tetap sama seperti sebelumnya ...

function newSoal(p) {
    if (gameEnded) return;
    const currentIndex = (p === 'P1') ? solvedP1 : solvedP2;

    // JIKA SOAL SUDAH HABIS, BERHENTI DI SINI
    if (currentIndex >= totalSoal) {
        const container = document.getElementById(p === 'P1' ? 'opt1' : 'opt2');
        container.innerHTML = "<h5>Menunggu lawan selesai... 🏁</h5>";
        
        // Cek apakah kedua pemain benar-benar sudah selesai semua soalnya
        if (solvedP1 >= totalSoal && solvedP2 >= totalSoal) {
            finish(); 
        }
        return; // PENTING: Jangan lanjut ke bawah kalau sudah habis
    }

    const s = (p === 'P1') ? soalP1[currentIndex] : soalP2[currentIndex];
    
    // Render nomor soal dan teks soal
    document.getElementById(p === 'P1' ? 'no1' : 'no2').innerText = `Soal #${currentIndex + 1}`;
    document.getElementById(p === 'P1' ? 'q1' : 'q2').innerText = s[1];
    
    const container = document.getElementById(p === 'P1' ? 'opt1' : 'opt2');
    container.innerHTML = '';
    
    // Acak pilihan jawaban (kolom 2, 3, 4, 5 di Sheet)
    let opts = [s[2], s[3], s[4], s[5]].filter(x => x).sort(() => Math.random() - 0.5);
    
    opts.forEach(txt => {
        const btn = document.createElement('button');
        btn.className = `btn btn-lg btn-outline-${p === 'P1' ? 'primary' : 'warning'} mb-2 w-100`;
        btn.innerText = txt;
        btn.onclick = () => check(p, txt.toString().toLowerCase().trim(), s[2].toString().toLowerCase().trim());
        container.appendChild(btn);
    });

    startTimer(p);
}

function check(p, input, kunci) {
    if (gameEnded) return;
    // Cek apakah sedang memproses soal (mencegah klik brutal/cepat)
    if (p === 'P1') {
        if (isProcessingP1) return;
        isProcessingP1 = true;
        clearInterval(timer1);
    } else {
        if (isProcessingP2) return;
        isProcessingP2 = true;
        clearInterval(timer2);
    }

    if (input === kunci) {
        if (p === 'P1') scoreP1++; else scoreP2++;
        pos += (p === 'P1' ? -4 : 4);
        document.getElementById('marker').style.left = pos + "%";
    }

    // Tambahkan jumlah soal yang terjawab
    if (p === 'P1') solvedP1++; else solvedP2++;

    // Beri jeda sedikit agar player bisa lihat feedback sebelum soal ganti
    setTimeout(() => {
        if (p === 'P1') isProcessingP1 = false; else isProcessingP2 = false;
        newSoal(p);
    }, 300);
}
function startTimer(p) {
    let sec = 10; 
    const el = document.getElementById(p === 'P1' ? 't1' : 't2');
    
    // 1. Bersihkan timer lama agar tidak ada dua timer berjalan bareng
    if (p === 'P1') clearInterval(timer1); else clearInterval(timer2);
    
    // Reset tampilan awal timer
    if(el) el.innerText = sec + "s";

    const task = setInterval(() => {
        sec--; 
        if(el) el.innerText = sec + "s";
        
        if (sec <= 0) { 
            clearInterval(task); // Stop timer ini
            
            // 2. Tambah hitungan soal pemain yang kehabisan waktu
            if (p === 'P1') {
                solvedP1++;
                isProcessingP1 = false; // Buka kunci agar soal baru bisa diklik
            } else {
                solvedP2++;
                isProcessingP2 = false; // Buka kunci agar soal baru bisa diklik
            }

            // 3. Cek apakah masih ada soal tersisa
            if (solvedP1 >= totalSoal && solvedP2 >= totalSoal) {
                finish();
            } else {
                // Pindah ke soal berikutnya secara otomatis
                newSoal(p); 
            }
        }
    }, 1000);

    // Simpan ID interval ke variabel global agar bisa di-stop saat jawaban diklik
    if (p === 'P1') timer1 = task; else timer2 = task;
}
function finish() {
    if (gameEnded) return;
    gameEnded = true;

    clearInterval(timer1); 
    clearInterval(timer2);

    // DISESUAIKAN DENGAN ID DI HTML (custom-overlay)
    const modal = document.getElementById('custom-overlay');
    const winnerDisplay = document.getElementById('winner-name');
    const scoreDisplay = document.getElementById('final-score');

    scoreDisplay.innerText = `${scoreP1} - ${scoreP2}`;

    let pemenang = (scoreP1 > scoreP2) ? "🎉 PLAYER 1 MENANG! 🎉" : 
                  (scoreP2 > scoreP1) ? "🎉 PLAYER 2 MENANG! 🎉" : "🤝 HASIL SERI! 🤝";

    winnerDisplay.innerText = pemenang;
    modal.style.display = 'flex';

    if (typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
}
function showCustomAlert(title, message) {
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;
    document.getElementById('modal-alert').style.display = 'flex';
}

// 3. Fungsi Tutup Alert
function closeAlert() {
    document.getElementById('modal-alert').style.display = 'none';
    document.getElementById('loader').style.display = 'none';
    document.getElementById('setup-box').style.display = 'block';
}