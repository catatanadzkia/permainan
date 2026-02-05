const API_URL = "https://script.google.com/macros/s/AKfycbw_5OYmFFh23TBmrVdwCFX5x6CVkHBS9IFBx_2rtsJcSG6uP26zgn4JRJf5Sm9p3BXZtQ/exec";

let pos = 50, soal = [], totalSoal = 0, solvedP1 = 0, solvedP2 = 0;
let scoreP1 = 0, scoreP2 = 0;
let timer1, timer2, curA, curB;


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

        if (data.error) throw new Error(data.error);

        // Filter data valid
        soal = data.filter(r => r[1] && r[2]);
        totalSoal = soal.length;

        // TAHAP 3: Masuk Game
        document.getElementById('loading-overlay').style.display = 'none';
        
        
        newSoal('P1'); 
        newSoal('P2');
        
    } catch (e) {
        alert("Gagal memuat data! Periksa ID Spreadsheet atau Nama Sheet.");
        // Kembalikan ke pilihan jika gagal
        document.getElementById('loader').style.display = 'none';
        document.getElementById('setup-box').style.display = 'block';
    }
}
// ... Sisa fungsi check(), newSoal(), startTimer() tetap sama seperti sebelumnya ...
function newSoal(p) {
    // Cek masing-masing pemain apakah sudah menghabiskan semua soal
    const currentSolved = (p === 'P1' ? solvedP1 : solvedP2);
    if (currentSolved >= totalSoal) {
        // Jika salah satu selesai, tunggu pemain lain atau langsung finish
        if (solvedP1 >= totalSoal && solvedP2 >= totalSoal) finish();
        return;
    }

    const s = soal[currentSolved]; // Ambil soal urut berdasarkan progress pemain
    const opts = [s[2], s[3], s[4], s[5]].filter(x => x).sort(() => Math.random() - 0.5);
    
    document.getElementById(p === 'P1' ? 'no1' : 'no2').innerText = `Soal #${currentSolved + 1}`;
    document.getElementById(p === 'P1' ? 'q1' : 'q2').innerText = s[1];
    
    const container = document.getElementById(p === 'P1' ? 'opt1' : 'opt2');
    container.innerHTML = '';
    
    opts.forEach(txt => {
        const btn = document.createElement('button');
        btn.className = `btn btn-lg btn-outline-${p === 'P1' ? 'primary' : 'warning'}`;
        btn.innerText = txt;
        btn.onclick = () => check(p, txt.toString().toLowerCase().trim(), s[2].toString().toLowerCase().trim());
        container.appendChild(btn);
    });
    startTimer(p);
}

function check(p, input, kunci) {
    if (input === kunci) {
        if (p === 'P1') scoreP1++; else scoreP2++;
        pos += (p === 'P1' ? -4 : 4);
        document.getElementById('marker').style.left = pos + "%";
        
        const char = document.getElementById(p === 'P1' ? 'char-p1' : 'char-p2');
        const pullClass = p === 'P1' ? 'p1-pull-anim' : 'p2-pull-anim';
        char.classList.add(pullClass);
        setTimeout(() => char.classList.remove(pullClass), 300);
    }

    // Tambah hitungan soal per pemain
    if (p === 'P1') solvedP1++; else solvedP2++;

    if (solvedP1 >= totalSoal && solvedP2 >= totalSoal) {
        finish();
    } else {
        setTimeout(() => newSoal(p), 300);
    }
}
function startTimer(p) {
    let sec = 10;
    const el = document.getElementById(p === 'P1' ? 't1' : 't2');
    if (p === 'P1') clearInterval(timer1); else clearInterval(timer2);
    
    const task = setInterval(() => {
        sec--; 
        if(el) el.innerText = sec + "s";
        if (sec <= 0) { 
            clearInterval(task); 
            solvedCount++;
            if (solvedCount >= totalSoal) finish(); else newSoal(p); 
        }
    }, 1000);
    if (p === 'P1') timer1 = task; else timer2 = task;
}
function finish() {
    clearInterval(timer1); clearInterval(timer2);
    const pemenang = scoreP1 > scoreP2 ? "PLAYER 1" : (scoreP2 > scoreP1 ? "PLAYER 2" : "SERI");
    alert(`GAME SELESAI!\nSkor: ${scoreP1} - ${scoreP2}\nPemenang: ${pemenang}`);
    location.reload();
}