const API_URL = "https://script.google.com/macros/s/AKfycbw_5OYmFFh23TBmrVdwCFX5x6CVkHBS9IFBx_2rtsJcSG6uP26zgn4JRJf5Sm9p3BXZtQ/exec";

let pos = 50, soal = [], totalSoal = 0, solvedP1 = 0, solvedP2 = 0, isProcessingP1 = false, isProcessingP2 = false;
let scoreP1 = 0, scoreP2 = 0;
let timer1, timer2, curA, curB;
let soalP1 = [], soalP2 = [];


// Fungsi yang dipanggil saat halaman terbuka
window.onload = () => {
    const loader = document.getElementById('loader');
    const setupBox = document.getElementById('setup-box');
    const loaderText = document.getElementById('loader-text');

    // Beri delay simulasi loading awal 1.5 detik agar estetik
    setTimeout(() => {
        loader.style.display = 'none';
        setupBox.style.display = 'block';
    }, 1500);
};

async function fetchDataSoal() {
    const idKelas = document.getElementById('kelas-select').value;
    const namaMapel = document.getElementById('mapel-select').value;

    if (!idKelas || !namaMapel) {
        alert("Pilih Kelas dan Mapel dulu ya!");
        return;
    }

    // Tampilkan loader lagi
    document.getElementById('setup-box').style.display = 'none';
    document.getElementById('loader').style.display = 'block';
    document.getElementById('loader-text').innerText = "Mengambil Soal " + namaMapel + "...";

    try {
        const response = await fetch(`${API_URL}?id=${idKelas}&sheet=${namaMapel}`);
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
        showCustomAlert("Soal Kosong", "Silakan hubungi untuk input text");
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
    // Tentukan pemain mana, ambil antrean mana
    const s = (p === 'P1') ? soalP1[solvedP1] : soalP2[solvedP2];
    const currentIndex = (p === 'P1') ? solvedP1 : solvedP2;

    if (currentIndex >= totalSoal) {
        document.getElementById(p === 'P1' ? 'opt1' : 'opt2').innerHTML = "<h5>SELESAI!</h5>";
        if (solvedP1 >= totalSoal && solvedP2 >= totalSoal) finish();
        return;
    }

    // Acak jawaban (biar kuncinya nggak di situ-situ terus)
    let opts = [s[2], s[3], s[4], s[5]].filter(x => x).sort(() => Math.random() - 0.5);
    
    document.getElementById(p === 'P1' ? 'no1' : 'no2').innerText = `Soal #${currentIndex + 1}`;
    document.getElementById(p === 'P1' ? 'q1' : 'q2').innerText = s[1];
    
    const container = document.getElementById(p === 'P1' ? 'opt1' : 'opt2');
    container.innerHTML = '';
    
    opts.forEach(txt => {
        const btn = document.createElement('button');
        btn.className = `btn btn-lg btn-outline-${p === 'P1' ? 'primary' : 'warning'} mb-2`;
        btn.innerText = txt;
        btn.onclick = () => check(p, txt.toString().toLowerCase().trim(), s[2].toString().toLowerCase().trim());
        container.appendChild(btn);
    });
    startTimer(p);
}

function check(p, input, kunci) {
    // Matikan timer pemain ini segera setelah klik
    if (p === 'P1') clearInterval(timer1); else clearInterval(timer2);

    if (input === kunci) {
        if (p === 'P1') scoreP1++; else scoreP2++;
        pos += (p === 'P1' ? -4 : 4);
        document.getElementById('marker').style.left = pos + "%";
        const char = document.getElementById(p === 'P1' ? 'char-p1' : 'char-p2');
        const pullClass = p === 'P1' ? 'p1-pull-anim' : 'p2-pull-anim';
        char.classList.add(pullClass);
        setTimeout(() => char.classList.remove(pullClass), 300);
    }

    // Update progres masing-masing
    if (p === 'P1') solvedP1++; else solvedP2++;

    // Lanjut ke soal berikutnya atau tampilkan status menunggu
    setTimeout(() => newSoal(p), 300);
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
    clearInterval(timer1); 
    clearInterval(timer2);

    const overlay = document.getElementById('custom-overlay');
    const winnerDisplay = document.getElementById('winner-name');
    const scoreDisplay = document.getElementById('final-score');

    // Logika Pemenang
    let pemenang;
    if (scoreP1 > scoreP2) {
        pemenang = "🎉 PLAYER 1 MENANG! 🎉";
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } else if (scoreP2 > scoreP1) {
        pemenang = "🎉 PLAYER 2 MENANG! 🎉";
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } else {
        pemenang = "🤝 HASIL SERI! 🤝";
    }

    // Tampilkan Data ke Modal
    scoreDisplay.innerText = `${scoreP1} - ${scoreP2}`;
    winnerDisplay.innerText = pemenang;

    const btn = document.querySelector('.btn-restart');
    btn.innerText = "MAIN LAGI 🎮";
    btn.onclick = () => location.reload();
    overlay.style.display = 'flex';
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