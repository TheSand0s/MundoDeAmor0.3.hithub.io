document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    const API_URL = "https://api.sheetbest.com/sheets/4bcecc19-2ef0-4616-af44-3433eaeb46c5";
    const APP_URL = "https://thesand0s.github.io/MundoDeAmor/";
    let currentUser = null; 

    // --- ELEMENTOS DEL DOM ---
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

    // INICIALIZACIÓN DE EMAILJS
    (function(){
        emailjs.init("kepBpPRHYPUPd-t_N");
    })();

    // CORREOS PARA NOTIFICACIONES
    const nanitaEmail = "ross71763@gmail.com";
    const sandyEmail = "sandouiis@gmail.com";

    // --- LÓGICA PRINCIPAL ---

    checkForApprovalAction();

    const userFromStorage = JSON.parse(localStorage.getItem('currentUser'));
    if (userFromStorage) {
        currentUser = userFromStorage;
        showAppView();
    } else if (!window.location.search.includes('accion=aprobar_mision')) {
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

            if (authenticatedUser) {
                handleSuccessfulLogin(authenticatedUser);
            } else {
                loginError.classList.remove('hidden');
            }
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

        if (currentUser.Rol === 'admin') {
            adminPanel.classList.remove('hidden');
        } else {
            adminPanel.classList.add('hidden');
        }
        loadAllData();
    }

    async function loadAllData() {
        appView.style.opacity = '0.5';
        try {
            const [pointsData, rewardsData, missionsData, goalsData, notificationsData] = await Promise.all([
                fetch(`${API_URL}/tabs/Puntos_Historial`).then(res => res.json()),
                fetch(`${API_URL}/tabs/Recompensas`).then(res => res.json()),
                fetch(`${API_URL}/tabs/Misiones`).then(res => res.json()),
                fetch(`${API_URL}/tabs/Metas`).then(res => res.json()),
                fetch(`${API_URL}/tabs/Notificaciones`).then(res => res.json())
            ]);

            displayPoints(pointsData);
            displayPointsHistory(pointsData);
            displayRewards(rewardsData);
            displayMissions(missionsData);
            displayGoals(goalsData, pointsData);
            displayNotifications(notificationsData);

        } catch (error) {
            console.error("Error cargando los datos de la app:", error);
            alert("Hubo un error al cargar los datos. Por favor, refresca la página.");
        } finally {
            appView.style.opacity = '1';
        }
    }

    function displayPoints(points) {
        const totalNanita = points.filter(p => p.Usuario === 'nanita').reduce((sum, p) => sum + Number(p.Cantidad), 0);
        const totalSandy = points.filter(p => p.Usuario === 'sandy').reduce((sum, p) => sum + Number(p.Cantidad), 0);
        nanitaPointsEl.textContent = totalNanita;
        sandyPointsEl.textContent = totalSandy;
    }

    function displayPointsHistory(points) {
        nanitaHistoryEl.innerHTML = '';
        sandyHistoryEl.innerHTML = '';
        const sortedPoints = [...points].sort((a, b) => (Number(b.ID) || 0) - (Number(a.ID) || 0));

        sortedPoints.forEach(p => {
            const listItem = document.createElement('li');
            const sign = Number(p.Cantidad) >= 0 ? '+' : '';
            listItem.innerHTML = `<span>${sign}${p.Cantidad}</span> - ${p.Motivo}`;
            if (p.Usuario === 'nanita') nanitaHistoryEl.appendChild(listItem);
            else if (p.Usuario === 'sandy') sandyHistoryEl.appendChild(listItem);
        });
    }

    function displayRewards(rewards) {
        rewardsGrid.innerHTML = '';
        rewards.forEach((reward, index) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                ${currentUser.Rol === 'admin' ? `<button class="delete-btn" data-index="${index}" data-tab="Recompensas" title="Eliminar recompensa">X</button>` : ''}
                <h4>${reward.Nombre}</h4>
                <p>${reward.Descripcion}</p>
                <p class="cost">Costo: ${reward.Costo} Puntos de Amor</p>
                <div class="item-actions">
                     <button class="canjear-btn" data-reward-name="${reward.Nombre}" data-reward-cost="${reward.Costo}">Canjear</button>
                </div>
            `;
            rewardsGrid.appendChild(card);
        });

        document.querySelectorAll('.canjear-btn').forEach(button => {
            button.addEventListener('click', handleCanjear);
        });
        addDeleteButtonListeners();
    }

    async function handleCanjear(e) {
        const cost = Number(e.target.dataset.rewardCost);
        const name = e.target.dataset.rewardName;
        
        const pointsData = await fetch(`${API_URL}/tabs/Puntos_Historial`).then(res => res.json());
        const userPoints = pointsData.filter(p => p.Usuario === currentUser.Nombre).reduce((sum, p) => sum + Number(p.Cantidad), 0);

        if (userPoints >= cost) {
            if (!confirm(`¿Canjear "${name}" por ${cost} puntos?`)) return;

            const deductionEntry = { ID: Date.now(), Usuario: currentUser.Nombre, Cantidad: -cost, Motivo: `Canje: ${name}`, Fecha: new Date().toLocaleDateString('es-ES') };
            await postDataToSheet('Puntos_Historial', deductionEntry, null);

            const otherUser = currentUser.Nombre === 'nanita' ? 'sandy' : 'nanita';
            const notification = { ID: Date.now() + 1, UsuarioANotificar: otherUser, Mensaje: `${currentUser.Nombre} ha canjeado '${name}'.`, Fecha: new Date().toLocaleDateString('es-ES'), Leido: 'FALSO' };
            await postDataToSheet('Notificaciones', notification, null);

            const emailToSendTo = currentUser.Nombre === 'nanita' ? sandyEmail : nanitaEmail;

            const templateParams = {
                user_name: currentUser.Nombre.charAt(0).toUpperCase() + currentUser.Nombre.slice(1),
                reward_name: name,
                to_email: emailToSendTo
            };
            
            try {
                await emailjs.send('service_3w96w7w', 'template_n1601u5', templateParams);
                alert(`¡Has canjeado "${name}" con éxito! ❤️\nSe ha enviado una notificación por correo.`);
            } catch(error) {
               console.error('Error al enviar el correo:', error);
               alert(`¡Has canjeado "${name}" con éxito! ❤️\n(Hubo un error al enviar la notificación por correo.)`);
            }
            loadAllData();
        } else {
            alert("¡Oh no! No tienes suficientes puntos para canjear esta recompensa.");
        }
    }

    function displayMissions(missions) {
        missionsGrid.innerHTML = '';
        const userMissions = missions.filter(m => m.Estado === 'Activa' && (m.Tipo === 'Colectiva' || m.AsignadoA === currentUser.Nombre));

        userMissions.forEach((mission, index) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                ${currentUser.Rol === 'admin' ? `<button class="delete-btn" data-index="${index}" data-tab="Misiones" title="Eliminar misión">X</button>` : ''}
                <h4>${mission.Titulo}</h4>
                <p>${mission.Descripcion}</p>
                <p class="mission-type">${mission.Tipo === 'Colectiva' ? 'Colectiva (para ambos)' : `Individual (para ${mission.AsignadoA})`}</p>
                <p class="cost">Recompensa: ${mission.RecompensaPuntos} Puntos</p>
                <div class="item-actions">
                     <button class="aceptar-mision-btn" data-mission-title="${mission.Titulo}" data-mission-points="${mission.RecompensaPuntos}">Aceptar Misión</button>
                </div>
            `;
            missionsGrid.appendChild(card);
        });

        document.querySelectorAll('.aceptar-mision-btn').forEach(button => {
            button.addEventListener('click', handleAcceptMission);
        });
        addDeleteButtonListeners();
    }

    async function handleAcceptMission(e) {
        const missionTitle = e.target.dataset.missionTitle;
        const missionPoints = e.target.dataset.missionPoints;

        if (!confirm(`¿Aceptar la misión "${missionTitle}"? Se enviará una notificación para su aprobación.`)) return;

        const approvalId = Date.now();
        const otherUser = currentUser.Nombre === 'nanita' ? 'sandy' : 'nanita';
        const emailToSendTo = currentUser.Nombre === 'nanita' ? sandyEmail : nanitaEmail;

        const activeMission = {
            AprobacionID: approvalId,
            MisionTitulo: missionTitle,
            UsuarioQueAcepto: currentUser.Nombre,
            RecompensaPuntos: missionPoints,
            Estado: 'Pendiente'
        };
        await postDataToSheet('MisionesActivas', activeMission, null);

        const magicLink = `${APP_URL}?accion=aprobar_mision&id=${approvalId}`;

        const templateParams = {
            user_name: currentUser.Nombre.charAt(0).toUpperCase() + currentUser.Nombre.slice(1),
            mission_title: missionTitle,
            magic_link: magicLink,
            to_email: emailToSendTo
        };

        try {
            await emailjs.send('service_3w96w7w', 'template_vlr3k3d', templateParams); 
            alert(`¡Has aceptado la misión "${missionTitle}"!\nSe ha enviado un correo a ${otherUser} para que la apruebe cuando la cumplas.`);
        } catch (error) {
            console.error('Error al enviar el correo de misión:', error);
            alert('Misión aceptada, pero hubo un error al enviar la notificación por correo.');
        }
    }

    function displayNotifications(notifications) {
        notificationsPanel.innerHTML = '';
        const userNotifications = notifications
            .filter(n => n.UsuarioANotificar === currentUser.Nombre && n.Leido === 'FALSO')
            .sort((a, b) => b.ID - a.ID);

        if (userNotifications.length > 0) {
            notificationCount.textContent = userNotifications.length;
            notificationCount.classList.remove('hidden');
        } else {
            notificationCount.classList.add('hidden');
        }
        
        if (userNotifications.length === 0) {
            notificationsPanel.innerHTML = '<div class="notification-item">No hay notificaciones nuevas.</div>';
        } else {
            userNotifications.forEach(n => {
                const item = document.createElement('div');
                item.className = 'notification-item';
                item.innerHTML = `<p>${n.Mensaje}</p><small>${n.Fecha}</small>`;
                notificationsPanel.appendChild(item);
            });
        }
    }

    function displayGoals(goals, points) {
        goalsContainer.innerHTML = '';
        const totalPoints = points.reduce((sum, p) => sum + Number(p.Cantidad), 0);
        goals.forEach(goal => {
            const progressPercentage = Math.min((totalPoints / Number(goal.PuntosNecesarios)) * 100, 100);
            const goalEl = document.createElement('div');
            goalEl.className = 'goal-bar';
            goalEl.innerHTML = `
                <p><span>${goal.NombreMeta}</span><span>${totalPoints} / ${goal.PuntosNecesarios}</span></p>
                <div class="progress-bar"><div class="progress" style="width: ${progressPercentage}%;"></div></div>
            `;
            goalsContainer.appendChild(goalEl);
        });
    }

    addPointsForm.addEventListener('submit', async (e) => { e.preventDefault(); const newEntry = { ID: Date.now(), Usuario: document.getElementById('admin-select-user').value, Cantidad: document.getElementById('admin-points-amount').value, Motivo: document.getElementById('admin-points-reason').value, Fecha: new Date().toLocaleDateString('es-ES') }; await postDataToSheet('Puntos_Historial', newEntry, "Puntos añadidos con éxito"); addPointsForm.reset(); });
    addRewardForm.addEventListener('submit', async (e) => { e.preventDefault(); const newReward = { Nombre: document.getElementById('admin-reward-name').value, Costo: document.getElementById('admin-reward-cost').value, Descripcion: document.getElementById('admin-reward-desc').value, Categoria: document.getElementById('admin-reward-category').value }; await postDataToSheet('Recompensas', newReward, "Recompensa creada con éxito"); addRewardForm.reset(); });
    adminMissionTypeSelect.addEventListener('change', (e) => { adminMissionAssigneeSelect.classList.toggle('hidden', e.target.value !== 'Individual'); });
    addMissionForm.addEventListener('submit', async (e) => { e.preventDefault(); const type = adminMissionTypeSelect.value; const assignee = type === 'Individual' ? adminMissionAssigneeSelect.value : ''; const newMission = { Titulo: document.getElementById('admin-mission-title').value, Descripcion: document.getElementById('admin-mission-desc').value, RecompensaPuntos: document.getElementById('admin-mission-points').value, Estado: 'Activa', Tipo: type, AsignadoA: assignee }; await postDataToSheet('Misiones', newMission, "Misión creada con éxito"); addMissionForm.reset(); adminMissionAssigneeSelect.classList.add('hidden'); });

    async function postDataToSheet(tabName, data, successMessage) {
        adminStatus.textContent = `Guardando en ${tabName}...`;
        try {
            const response = await fetch(`${API_URL}/tabs/${tabName}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([data]) });
            if (response.ok) {
                if (successMessage) adminStatus.textContent = successMessage;
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
        if (action === 'aprobar_mision' && approvalId) {
            document.body.innerHTML = `<h1 style="color: #cdd6f4; font-family: Poppins, sans-serif; text-align: center; padding-top: 50px;">Procesando aprobación...</h1>`;
            try {
                const activeMissions = await fetch(`${API_URL}/tabs/MisionesActivas`).then(res => res.json());
                const missionIndex = activeMissions.findIndex(m => m.AprobacionID === approvalId && m.Estado === 'Pendiente');
                if (missionIndex !== -1) {
                    const missionToApprove = activeMissions[missionIndex];
                    const pointsEntry = { ID: Date.now(), Usuario: missionToApprove.UsuarioQueAcepto, Cantidad: missionToApprove.RecompensaPuntos, Motivo: `Misión cumplida: ${missionToApprove.MisionTitulo}`, Fecha: new Date().toLocaleDateString('es-ES') };
                    await postDataToSheet('Puntos_Historial', pointsEntry, null);
                    await fetch(`${API_URL}/tabs/MisionesActivas/${missionIndex}`, { method: 'DELETE' });
                    missionToApprove.Estado = 'Completada';
                    await postDataToSheet('MisionesActivas', missionToApprove, null);
                    document.body.innerHTML = `<div style="color: #cdd6f4; font-family: Poppins, sans-serif; text-align: center; padding-top: 50px;"><h1>¡Misión aprobada con éxito!</h1><p>Se han añadido ${missionToApprove.RecompensaPuntos} puntos a ${missionToApprove.UsuarioQueAcepto}.</p><p>Puedes cerrar esta ventana.</p></div>`;
                } else { document.body.innerHTML = `<div style="color: #cdd6f4; font-family: Poppins, sans-serif; text-align: center; padding-top: 50px;"><h1>Error</h1><p>Esta misión ya fue aprobada o el enlace no es válido.</p></div>`; }
            } catch (error) {
                console.error("Error al aprobar misión:", error);
                document.body.innerHTML = `<div style="color: #cdd6f4; font-family: Poppins, sans-serif; text-align: center; padding-top: 50px;"><h1>Error</h1><p>No se pudo procesar la solicitud.</p></div>`;
            }
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    notificationIcon.addEventListener('click', (e) => { e.stopPropagation(); notificationsPanel.classList.toggle('hidden'); });
    document.addEventListener('click', (e) => { if (!notificationsBell.contains(e.target)) { notificationsPanel.classList.add('hidden'); } });
});