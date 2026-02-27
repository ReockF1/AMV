const API_BASE = '/api';  // 相对于当前域

let videos = [];

// DOM 元素
const grid = document.getElementById('video-grid');
const playerModal = document.getElementById('player-modal');
const adminModal = document.getElementById('admin-modal');
const playerContainer = document.getElementById('player-container');
const modalTitle = document.getElementById('modal-title');
const closeModal = document.getElementById('close-modal');
const closeAdmin = document.getElementById('close-admin');
const adminFab = document.getElementById('admin-fab');
const addBtn = document.getElementById('add-video-btn');
const adminKey = document.getElementById('admin-key');
const bvInput = document.getElementById('bv-input');
const adminMsg = document.getElementById('admin-message');

// 关闭模态框通用
closeModal.onclick = () => {
    playerModal.style.display = 'none';
    playerContainer.innerHTML = ''; // 停止视频
};
closeAdmin.onclick = () => {
    adminModal.style.display = 'none';
    adminMsg.innerText = '';
};
adminFab.onclick = () => {
    adminModal.style.display = 'flex';
};
window.onclick = (e) => {
    if (e.target === playerModal) {
        playerModal.style.display = 'none';
        playerContainer.innerHTML = '';
    }
    if (e.target === adminModal) {
        adminModal.style.display = 'none';
        adminMsg.innerText = '';
    }
};

// 加载视频列表
async function loadVideos() {
    try {
        const res = await fetch(`${API_BASE}/videos`);
        videos = await res.json();
        renderGrid();
    } catch (err) {
        grid.innerHTML = `<div class="loading">加载失败，请刷新</div>`;
    }
}

function renderGrid() {
    if (!videos.length) {
        grid.innerHTML = `<div class="loading">暂无视频，点击右下角添加BV号</div>`;
        return;
    }
    grid.innerHTML = videos.map(v => `
        <div class="video-card" data-bv="${v.bv}" data-title="${v.title}">
            <div class="cover-wrapper">
                <img class="cover-img" src="${v.cover}" loading="lazy" alt="${v.title}">
            </div>
            <div class="video-title">${v.title}</div>
        </div>
    `).join('');

    // 绑定点击事件
    document.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', () => {
            const bv = card.dataset.bv;
            const title = card.dataset.title;
            openPlayer(bv, title);
        });
    });
}

function openPlayer(bv, title) {
    modalTitle.innerText = title;
    playerContainer.innerHTML = `
        <iframe src="https://player.bilibili.com/player.html?bvid=${bv}&page=1&high_quality=1&autoplay=1" 
                allowfullscreen="true" 
                scrolling="no" 
                frameborder="0">
        </iframe>
    `;
    playerModal.style.display = 'flex';
}

// 添加视频
addBtn.addEventListener('click', async () => {
    const key = adminKey.value.trim();
    const bv = bvInput.value.trim();

    if (!key || !bv) {
        adminMsg.innerText = '请填写密码和BV号';
        return;
    }

    adminMsg.innerText = '提交中...';
    try {
        const res = await fetch(`${API_BASE}/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, bv })
        });
        const data = await res.json();
        if (res.ok) {
            adminMsg.innerText = '添加成功！';
            adminKey.value = '';
            bvInput.value = '';
            loadVideos(); // 刷新列表
            setTimeout(() => adminModal.style.display = 'none', 1000);
        } else {
            adminMsg.innerText = data.error || '添加失败';
        }
    } catch (err) {
        adminMsg.innerText = '网络错误';
    }
});

// 初始化
loadVideos();