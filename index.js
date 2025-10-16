document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    const API_URL = "https://api.sheetbest.com/sheets/4bcecc19-2ef0-4616-af44-3433eaeb46c5";
    // URL Corregida aquí
    const APP_URL = "https://thesand0s.github.io/MundoDeAmor0.3.github.io/"; 
    let currentUser = null; 

    // --- ELEMENTOS DEL DOM ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutBtn = document.getElementById('logout-btn');
    const nanitaPointsEl = document.getElementById('nanita-points');
    const sandyPointsEl = document.getElementById('sandy-points');
    const nanitaHistoryEl = document.getElementById('nanita-history');
    const sandyHistoryEl = document.getElementById('sandy-history');
    const notificationsBell = document.getElementById('notifications-bell');
    const notificationIcon = document.getElementById('notification-icon');
    const notificationCount = document.getElementById('notification-count');
    const notificationsPanel = document.getElementById('notifications-panel');
    const adminPanel = document.getElementById('admin-panel');
    const addPointsForm = document.getElementById('add-points-form');
    const addRewardForm = document.getElementById('add-reward-form');
    const addMissionForm = document.getElementById('add-mission-form');
    const adminMissionTypeSelect = document.getElementById('admin-mission-type');
    const adminMissionAssigneeSelect = document.getElementById('admin-mission-assignee');
    const adminStatus = document.getElementById('admin-status');
    const rewardsGrid = document.getElementById('rewards-grid');
    const missionsGrid = document.getElementById('missions-grid');
    const goalsContainer = document.getElementById('goals-container');

    // --- LÓGICA DEL TEMA ---
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
    } else {
        body.classList.remove('dark-theme');
        themeToggle.textContent = '🌙';
    }
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        if (body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '☀️';
        } else {
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = '🌙';
        }
    });

    // --- LÓGICA PRINCIPAL ---
    (function(){ emailjs.init("kepBpPRHYPUPd-t_N"); })();
    const nanitaEmail = "ross71763@gmail.com";
    const sandyEmail = "sandouiis@gmail.com";

    checkForApprovalAction();

    const userFromStorage = JSON.parse(localStorage.getItem('currentUser'));
    if (userFromStorage) {
        currentUser = userFromStorage;
        showAppView();
    } else if (!window.location.search.includes('accion=')) {
        loginView.classList.remove('hidden');
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.classList.add('hidden');
        const username = usernameInput.value.trim().toLowerCase();
        const password = passwordInput.value.trim();
        try {
            const response = await fetch(`${API_URL}/tabs/Usuarios`);
            if (!response.ok) throw new Error('Network response was not ok');
            const users = await response.json();
            const authenticatedUser = users.find(u => u.Nombre.toLowerCase() === username && u.Contraseña === password);
            if (authenticatedUser) { handleSuccessfulLogin(authenticatedUser); } 
            else { loginError.classList.remove('hidden'); }
        } catch (error) {
            console.error("Error de login:", error);
            loginError.textContent = "Error al conectar con el servidor.";
            loginError.classList.remove('hidden');
        }
    });

    function handleSuccessfulLogin(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        currentUser = user;
        loginView.classList.add('hidden');
        showAppView();
    }

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        currentUser = null;
        appView.classList.add('hidden');
        adminPanel.classList.add('hidden');
        loginView.classList.remove('hidden');
    });

    function showAppView() {
        appView.classList.remove('hidden');
        const displayName = currentUser.Nombre.charAt(0).toUpperCase() + currentUser.Nombre.slice(1);
        welcomeMessage.textContent = `¡Hola, ${displayName}!`;
        if (currentUser.Rol === 'admin') { adminPanel.classList.remove('hidden'); } 
        else { adminPanel.classList.add('hidden'); }
        loadAllData();
    }

    async function loadAllData() {
        appView.style.opacity = '0.5';
        try {
            const responses = await Promise.all([
                fetch(`${API_URL}/tabs/Puntos_Historial`), fetch(`${API_URL}/tabs/Recompensas`),
                fetch(`${API_URL}/tabs/Misiones`), fetch(`${API_URL}/tabs/Metas`),
                fetch(`${API_URL}/tabs/Notificaciones`), fetch(`${API_URL}/tabs/MisionesActivas`)
            ]);
            for (const response of responses) { if (!response.ok) throw new Error('Failed to fetch data'); }
            const [pointsData, rewardsData, missionsData, goalsData, notificationsData, activeMissionsData] = await Promise.all(responses.map(r => r.json()));
            displayPoints(pointsData);
            displayPointsHistory(pointsData);
            displayRewards(rewardsData);
            displayMissions(missionsData, activeMissionsData);
            displayGoals(goalsData, pointsData);
            displayNotifications(notificationsData);
        } catch (error) {
            console.error("Error cargando los datos de la app:", error);
            alert("Hubo un error al cargar los datos. Revisa los permisos de la hoja de cálculo y los nombres de las pestañas.");
        } finally {
            appView.style.opacity = '1';
        }
    }

    function displayPoints(points) {
        nanitaPointsEl.textContent = points.filter(p => p.Usuario === 'nanita').reduce((sum, p) => sum + Number(p.Cantidad), 0);
        sandyPointsEl.textContent = points.filter(p => p.Usuario === 'sandy').reduce((sum, p) => sum + Number(p.Cantidad), 0);
    }
    
    function displayPointsHistory(points) {
        nanitaHistoryEl.innerHTML = ''; sandyHistoryEl.innerHTML = '';
        [...points].sort((a, b) => (Number(b.ID) || 0) - (Number(a.ID) || 0)).forEach(p => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<span>${Number(p.Cantidad) >= 0 ? '+' : ''}${p.Cantidad}</span> - ${p.Motivo}`;
            if (p.Usuario === 'nanita') nanitaHistoryEl.appendChild(listItem);
            else if (p.Usuario === 'sandy') sandyHistoryEl.appendChild(listItem);
        });
    }

    function displayRewards(rewards) {
        rewardsGrid.innerHTML = '';
        rewards.forEach((reward, index) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `${currentUser.Rol === 'admin' ? `<button class="delete-btn" data-index="${index}" data-tab="Recompensas" title="Eliminar recompensa">X</button>` : ''}<h4>${reward.Nombre}</h4><p>${reward.Descripcion}</p><p class="cost">Costo: ${reward.Costo} Puntos de Amor</p><div class="item-actions"><button class="canjear-btn" data-reward-name="${reward.Nombre}" data-reward-cost="${reward.Costo}">Canjear</button></div>`;
            rewardsGrid.appendChild(card);
        });
        document.querySelectorAll('.canjear-btn').forEach(b => b.addEventListener('click', handleCanjear));
        addDeleteButtonListeners();
    }

    async function handleCanjear(e) {
        const cost = Number(e.target.dataset.rewardCost), name = e.target.dataset.rewardName;
        const pointsData = await fetch(`${API_URL}/tabs/Puntos_Historial`).then(res => res.json());
        const userPoints = pointsData.filter(p => p.Usuario === currentUser.Nombre).reduce((sum, p) => sum + Number(p.Cantidad), 0);
        if (userPoints >= cost) {
            if (!confirm(`¿Canjear "${name}" por ${cost} puntos?`)) return;
            const deductionEntry = { ID: Date.now(), Usuario: currentUser.Nombre, Cantidad: -cost, Motivo: `Canje: ${name}`, Fecha: new Date().toLocaleDateString('es-ES') };
            await postDataToSheet('Puntos_Historial', deductionEntry, null);
            const otherUser = currentUser.Nombre === 'nanita' ? 'sandy' : 'nanita';
            const notification = { ID: Date.now() + 1, UsuarioANotificar: otherUser, Mensaje: `${currentUser.Nombre} ha canjeado '${name}'.`, Fecha: new Date().toLocaleDateString('es-ES'), Leido: 'FALSO' };
            await postDataToSheet('Notificaciones', notification, null);
            const templateParams = { user_name: currentUser.Nombre.charAt(0).toUpperCase() + currentUser.Nombre.slice(1), reward_name: name, to_email: currentUser.Nombre === 'nanita' ? sandyEmail : nanitaEmail };
            try {
                await emailjs.send('service_3w96w7w', 'template_n1601u5', templateParams);
                alert(`¡Has canjeado "${name}" con éxito! ❤️\nSe ha enviado una notificación por correo.`);
            } catch (error) {
                console.error('Error al enviar el correo:', error);
                alert(`¡Has canjeado "${name}" con éxito! ❤️\n(Hubo un error al enviar la notificación por correo.)`);
            }
            loadAllData();
        } else { alert("¡Oh no! No tienes suficientes puntos para canjear esta recompensa."); }
    }

    function displayMissions(missions, activeMissions) {
        missionsGrid.innerHTML = '';
        const userMissions = missions.filter(m => m.Estado === 'Activa' && (m.Tipo === 'Colectiva' || m.AsignadoA === currentUser.Nombre));
        userMissions.forEach((mission, index) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            const isAccepted = activeMissions.some(am => am.MisionTitulo === mission.Titulo && am.UsuarioQueAcepto === currentUser.Nombre && am.Estado === 'Pendiente');
            card.innerHTML = `${currentUser.Rol === 'admin' ? `<button class="delete-btn" data-index="${index}" data-tab="Misiones" title="Eliminar misión">X</button>` : ''}<h4>${mission.Titulo}</h4><p>${mission.Descripcion}</p><p class="mission-type">${mission.Tipo === 'Colectiva' ? 'Colectiva (para ambos)' : `Individual (para ${mission.AsignadoA})`}</p><p class="cost">Recompensa: ${mission.RecompensaPuntos} Puntos</p><div class="item-actions"><button class="aceptar-mision-btn" data-mission-title="${mission.Titulo}" data-mission-points="${mission.RecompensaPuntos}" ${isAccepted ? 'disabled' : ''}>${isAccepted ? 'Pendiente...' : 'Aceptar Misión'}</button></div>`;
            missionsGrid.appendChild(card);
        });
        document.querySelectorAll('.aceptar-mision-btn').forEach(b => b.addEventListener('click', handleAcceptMission));
        addDeleteButtonListeners();
    }

    async function handleAcceptMission(e) {
        const missionTitle = e.target.dataset.missionTitle, missionPoints = e.target.dataset.missionPoints;
        if (!confirm(`¿Aceptar la misión "${missionTitle}"? Se enviará una notificación para su aprobación.`)) return;
        
        e.target.disabled = true;
        e.target.textContent = 'Enviando...';

        const approvalId = Date.now();
        const activeMission = { AprobacionID: approvalId, MisionTitulo: missionTitle, UsuarioQueAcepto: currentUser.Nombre, RecompensaPuntos: missionPoints, Estado: 'Pendiente' };
        await postDataToSheet('MisionesActivas', activeMission, null);

        const magicLinkSuccess = `${APP_URL}?accion=aprobar_mision&id=${approvalId}`;
        const magicLinkFail = `${APP_URL}?accion=rechazar_mision&id=${approvalId}`;

        const templateParams = { 
            user_name: currentUser.Nombre.charAt(0).toUpperCase() + currentUser.Nombre.slice(1), 
            mission_title: missionTitle, 
            magic_link_success: magicLinkSuccess,
            magic_link_fail: magicLinkFail,
            to_email: currentUser.Nombre === 'nanita' ? sandyEmail : nanitaEmail 
        };

        try {
            await emailjs.send('service_3w96w7w', 'template_vlr3k3d', templateParams);
            alert(`¡Has aceptado la misión "${missionTitle}"!\nSe ha enviado un correo para su aprobación.`);
            e.target.textContent = 'Pendiente...';
        } catch (error) { 
            console.error('Error al enviar el correo de misión:', error); 
            alert('Misión aceptada, pero hubo un error al enviar la notificación.');
            e.target.disabled = false;
            e.target.textContent = 'Aceptar Misión';
        }
    }
    
    function displayNotifications(notifications) {
        notificationsPanel.innerHTML = '';
        const userNotifications = notifications.filter(n => n.UsuarioANotificar === currentUser.Nombre && n.Leido === 'FALSO').sort((a, b) => b.ID - a.ID);
        notificationCount.textContent = userNotifications.length;
        notificationCount.classList.toggle('hidden', userNotifications.length === 0);
        if (userNotifications.length === 0) { notificationsPanel.innerHTML = '<div class="notification-item">No hay notificaciones nuevas.</div>'; } 
        else { userNotifications.forEach(n => { const item = document.createElement('div'); item.className = 'notification-item'; item.innerHTML = `<p>${n.Mensaje}</p><small>${n.Fecha}</small>`; notificationsPanel.appendChild(item); }); }
    }

    function displayGoals(goals, points) {
        goalsContainer.innerHTML = '';
        const totalPoints = points.reduce((sum, p) => sum + Number(p.Cantidad), 0);
        goals.forEach(goal => {
            const progressPercentage = Math.min((totalPoints / Number(goal.PuntosNecesarios)) * 100, 100);
            const goalEl = document.createElement('div');
            goalEl.className = 'goal-bar';
            goalEl.innerHTML = `<p><span>${goal.NombreMeta}</span><span>${totalPoints} / ${goal.PuntosNecesarios}</span></p><div class="progress-bar"><div class="progress" style="width: ${progressPercentage}%;"></div></div>`;
            goalsContainer.appendChild(goalEl);
        });
    }

    addPointsForm.addEventListener('submit', async (e) => { e.preventDefault(); const newEntry = { ID: Date.now(), Usuario: document.getElementById('admin-select-user').value, Cantidad: document.getElementById('admin-points-amount').value, Motivo: document.getElementById('admin-points-reason').value, Fecha: new Date().toLocaleDateString('es-ES') }; await postDataToSheet('Puntos_Historial', newEntry, "Puntos añadidos"); addPointsForm.reset(); });
    addRewardForm.addEventListener('submit', async (e) => { e.preventDefault(); const newReward = { Nombre: document.getElementById('admin-reward-name').value, Costo: document.getElementById('admin-reward-cost').value, Descripcion: document.getElementById('admin-reward-desc').value, Categoria: document.getElementById('admin-reward-category').value }; await postDataToSheet('Recompensas', newReward, "Recompensa creada"); addRewardForm.reset(); });
    adminMissionTypeSelect.addEventListener('change', (e) => { adminMissionAssigneeSelect.classList.toggle('hidden', e.target.value !== 'Individual'); });
    addMissionForm.addEventListener('submit', async (e) => { e.preventDefault(); const type = adminMissionTypeSelect.value, assignee = type === 'Individual' ? adminMissionAssigneeSelect.value : ''; const newMission = { Titulo: document.getElementById('admin-mission-title').value, Descripcion: document.getElementById('admin-mission-desc').value, RecompensaPuntos: document.getElementById('admin-mission-points').value, Estado: 'Activa', Tipo: type, AsignadoA: assignee }; await postDataToSheet('Misiones', newMission, "Misión creada"); addMissionForm.reset(); adminMissionAssigneeSelect.classList.add('hidden'); });

    async function postDataToSheet(tabName, data, successMessage) {
        adminStatus.textContent = `Guardando en ${tabName}...`;
        try {
            const response = await fetch(`${API_URL}/tabs/${tabName}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([data]) });
            if (response.ok) {
                if (successMessage) adminStatus.textContent = `${successMessage} con éxito`;
                if (currentUser) loadAllData();
            } else { throw new Error('Falló la petición'); }
        } catch (error) {
            console.error(`Error añadiendo a ${tabName}:`, error);
            adminStatus.textContent = "Error al guardar los datos.";
        }
        setTimeout(() => { adminStatus.textContent = ''; }, 3000);
    }

    function addDeleteButtonListeners() {
        if (!currentUser || currentUser.Rol !== 'admin') return;
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const rowIndex = Number(e.target.dataset.index), tabName = e.target.dataset.tab;
                if (confirm(`¿Estás seguro de que quieres eliminar este elemento?`)) {
                    try {
                        const response = await fetch(`${API_URL}/tabs/${tabName}/${rowIndex}`, { method: 'DELETE' });
                        if (response.ok) { alert("Elemento eliminado con éxito."); loadAllData(); } 
                        else { throw new Error('Falló la eliminación.'); }
                    } catch (error) { console.error("Error al eliminar:", error); alert(error.message); }
                }
            });
        });
    }

    async function checkForApprovalAction() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('accion'), approvalId = urlParams.get('id');

        if ((action === 'aprobar_mision' || action === 'rechazar_mision') && approvalId) {
            document.body.innerHTML = `<h1 style="color: #cdd6f4; font-family: Poppins, sans-serif; text-align: center; padding-top: 50px;">Procesando solicitud...</h1>`;
            try {
                const activeMissions = await fetch(`${API_URL}/tabs/MisionesActivas`).then(res => res.json());
                const missionIndex = activeMissions.findIndex(m => m.AprobacionID.toString() === approvalId && m.Estado === 'Pendiente');
                if (missionIndex !== -1) {
                    const missionToProcess = activeMissions[missionIndex];
                    let pointsEntry, finalState, message;
                    if (action === 'aprobar_mision') {
                        pointsEntry = { Cantidad: missionToProcess.RecompensaPuntos, Motivo: `Misión cumplida: ${missionToProcess.MisionTitulo}` };
                        finalState = 'Completada';
                        message = `<h1>¡Misión aprobada!</h1><p>Se han añadido ${missionToProcess.RecompensaPuntos} puntos a ${missionToProcess.UsuarioQueAcepto}.</p>`;
                    } else {
                        pointsEntry = { Cantidad: -missionToProcess.RecompensaPuntos, Motivo: `Misión no cumplida: ${missionToProcess.MisionTitulo}` };
                        finalState = 'Fallida';
                        message = `<h1>Misión no cumplida</h1><p>Se han restado ${missionToProcess.RecompensaPuntos} puntos a ${missionToProcess.UsuarioQueAcepto}.</p>`;
                    }
                    const newPoints = { ID: Date.now(), Usuario: missionToProcess.UsuarioQueAcepto, ...pointsEntry, Fecha: new Date().toLocaleDateString('es-ES') };
                    await postDataToSheet('Puntos_Historial', newPoints, null);
                    await fetch(`${API_URL}/tabs/MisionesActivas/${missionIndex}`, { method: 'DELETE' });
                    missionToProcess.Estado = finalState;
                    await postDataToSheet('MisionesActivas', missionToProcess, null);
                    document.body.innerHTML = `<div style="color: #cdd6f4; font-family: Poppins, sans-serif; text-align: center; padding-top: 50px;">${message}<p>Puedes cerrar esta ventana.</p></div>`;
                } else { document.body.innerHTML = `<div style="color: #cdd6f4; font-family: Poppins, sans-serif; text-align: center; padding-top: 50px;"><h1>Error</h1><p>Esta misión ya fue procesada o el enlace no es válido.</p></div>`; }
            } catch (error) {
                console.error("Error al procesar la misión:", error);
                document.body.innerHTML = `<div style="color: #cdd6f4; font-family: Poppins, sans-serif; text-align: center; padding-top: 50px;"><h1>Error</h1><p>No se pudo procesar la solicitud.</p></div>`;
            }
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    notificationIcon.addEventListener('click', (e) => { e.stopPropagation(); notificationsPanel.classList.toggle('hidden'); });
    document.addEventListener('click', (e) => { if (!notificationsBell.contains(e.target)) { notificationsPanel.classList.add('hidden'); } });

});