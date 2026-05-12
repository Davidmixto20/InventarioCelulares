const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/equipos'
    : 'https://inventariocelulares.onrender.com/api/equipos';
let equipoModal;
let retornoModal;
let currentSection = 'dashboard';
let charts = {};

document.addEventListener('DOMContentLoaded', () => {
    equipoModal = new bootstrap.Modal(document.getElementById('equipoModal'));
    retornoModal = new bootstrap.Modal(document.getElementById('retornoModal'));
    
    switchSection('dashboard');
    
    document.getElementById('searchInput').addEventListener('input', debounce(loadEquipos, 300));
    document.getElementById('filterEstado').addEventListener('change', loadEquipos);
    document.getElementById('equipoForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('retornoForm').addEventListener('submit', handleRetornoSubmit);
    document.getElementById('cedula_pasaporte').addEventListener('blur', handleCedulaBlur);
    
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
        document.getElementById('sidebar-wrapper').classList.toggle('d-none');
    });
});

function switchSection(sectionId) {
    currentSection = sectionId;
    
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.add('d-none');
    });
    
    document.getElementById(`section-${sectionId}`).classList.remove('d-none');
    
    document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const links = document.querySelectorAll('#sidebar-wrapper .list-group-item');
    links.forEach(link => {
        if (link.getAttribute('onclick').includes(sectionId)) {
            link.classList.add('active');
        }
    });
    
    if (sectionId === 'dashboard') {
        loadDashboardStats();
    } else if (sectionId === 'inventario') {
        loadEquipos();
    }
}

async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_URL}/stats/dashboard`);
        const data = await response.json();
        
        document.getElementById('dashStatTotal').innerText = data.stats.total || 0;
        document.getElementById('dashStatDisponibles').innerText = data.stats.disponibles || 0;
        document.getElementById('dashStatPrestados').innerText = data.stats.prestados || 0;
        document.getElementById('dashStatMantenimiento').innerText = data.stats.mantenimiento || 0;
        
        renderCharts(data);
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function renderCharts(data) {
    const ctx1 = document.getElementById('chartMostBorrowed').getContext('2d');
    
    if (charts.mostBorrowed) {
        charts.mostBorrowed.destroy();
    }
    
    charts.mostBorrowed = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: data.mostBorrowed.map(item => item.nombre),
            datasets: [{
                label: 'Veces Prestado',
                data: data.mostBorrowed.map(item => item.count),
                backgroundColor: 'rgba(0, 224, 255, 0.5)',
                borderColor: 'rgba(0, 224, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#fff' }
                },
                x: {
                    ticks: { color: '#fff' }
                }
            },
            plugins: {
                legend: { labels: { color: '#fff' } }
            }
        }
    });
    
    const ctx2 = document.getElementById('chartDistribution').getContext('2d');
    
    if (charts.distribution) {
        charts.distribution.destroy();
    }
    
    charts.distribution = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Disponibles', 'Prestados', 'Mantenimiento'],
            datasets: [{
                data: [data.stats.disponibles, data.stats.prestados, data.stats.mantenimiento],
                backgroundColor: [
                    'rgba(0, 255, 178, 0.6)',
                    'rgba(255, 184, 48, 0.6)',
                    'rgba(255, 77, 109, 0.6)'
                ],
                borderColor: [
                    'rgba(0, 255, 178, 1)',
                    'rgba(255, 184, 48, 1)',
                    'rgba(255, 77, 109, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#fff' }
                }
            }
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function loadEquipos() {
    try {
        const search = document.getElementById('searchInput').value;
        const estado = document.getElementById('filterEstado').value;
        let url = API_URL;
        const params = new URLSearchParams();
        if (search) params.append('nombre', search);
        if (estado) params.append('estado', estado);
        if (params.toString()) url += '?' + params.toString();
        const response = await fetch(url);
        const data = await response.json();
        
        document.getElementById('registrosCount').innerText = `${data.length} registros`;
        renderTable(data);
    } catch (error) {
        showError('No se pudieron cargar los equipos.');
    }
}

function renderTable(equipos) {
    const tbody = document.getElementById('equiposTableBody');
    tbody.innerHTML = '';
    if (equipos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No se encontraron equipos</td></tr>';
        return;
    }

    const groups = {};
    equipos.forEach(eq => {
        const key = eq.estado === 'prestado' ? (eq.prestado_a || 'Sin Nombre') : (eq.estado === 'mantenimiento' ? 'En Reparación' : 'Disponibles');
        if (!groups[key]) groups[key] = [];
        groups[key].push(eq);
    });

    for (const [client, items] of Object.entries(groups)) {
        const headerTr = document.createElement('tr');
        headerTr.className = 'group-header';
        headerTr.innerHTML = `<td colspan="7" class="fw-bold py-2"><i class="bi bi-person-fill me-2"></i>${escapeHtml(client)} <span class="badge bg-secondary ms-2">${items.length}</span></td>`;
        tbody.appendChild(headerTr);

        items.forEach(eq => {
            const tr = document.createElement('tr');
            const isPrestado = eq.estado === 'prestado';
            
            let badgeClass = 'bg-success';
            if (eq.estado === 'prestado') badgeClass = 'bg-warning text-dark';
            if (eq.estado === 'mantenimiento') badgeClass = 'bg-danger';
            
            const formatFecha = (fechaStr) => {
                if (!fechaStr) return '-';
                const d = new Date(fechaStr);
                return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
            };
            const fechaPrestamo = isPrestado ? formatFecha(eq.fecha_prestamo) : '-';
            const fechaDevolucion = isPrestado ? formatFecha(eq.fecha_devolucion) : '-';
            const imgUrl = eq.imagen && eq.imagen.trim() !== '' ? eq.imagen : null;
            
            tr.innerHTML = `
                <td>
                    <div class="d-flex flex-column position-relative equipo-name-cell">
                        <span class="fw-bold text-dark">${escapeHtml(eq.nombre)}</span>
                        <span class="text-secondary font-mono x-small" style="font-size: 0.7rem;">${escapeHtml(eq.marca || '-')} / ${escapeHtml(eq.modelo || '-')}</span>
                        ${imgUrl ? `
                        <div class="hover-preview shadow-lg rounded-3 border border-glass">
                            <img src="${imgUrl}" alt="Preview" style="width: 120px; height: 120px; object-fit: cover;">
                        </div>` : ''}
                    </div>
                </td>
                <td><span class="text-primary">${isPrestado ? escapeHtml(eq.prestado_a) : '-'}</span></td>
                <td><span class="text-secondary small">${isPrestado ? escapeHtml(eq.cedula_pasaporte || '-') : '-'}</span></td>
                <td><span class="font-mono small text-dark">${fechaPrestamo}</span></td>
                <td><span class="text-danger font-mono small">${fechaDevolucion}</span></td>
                <td><span class="badge ${badgeClass} rounded-pill px-3">${eq.estado}</span></td>
                <td class="text-end">
                    <div class="d-flex justify-content-end gap-2">
                        ${isPrestado ? `
                        <button class="btn btn-outline-success btn-sm" onclick="openRetornoModal(${eq.id})">
                            <i class="bi bi-arrow-return-left"></i> Devolver
                        </button>` : ''}
                        <button class="btn btn-outline-secondary btn-sm" onclick='editEquipo(${JSON.stringify(eq).replace(/'/g, "\\'")})'>
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-secondary btn-sm text-danger" onclick="deleteEquipo(${eq.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function prepareAdd() {
    document.getElementById('equipoForm').reset();
    document.getElementById('equipoId').value = '';
    document.getElementById('equipoModalLabel').innerText = 'Nuevo Equipo';
    document.getElementById('formAlert').classList.add('d-none');
    togglePrestadoA();
}

function editEquipo(equipo) {
    document.getElementById('equipoId').value = equipo.id;
    document.getElementById('nombre').value = equipo.nombre;
    document.getElementById('marca').value = equipo.marca || '';
    document.getElementById('modelo').value = equipo.modelo || '';
    document.getElementById('estado').value = equipo.estado;
    document.getElementById('prestado_a').value = equipo.prestado_a || '';
    document.getElementById('tipo_documento').value = equipo.tipo_documento || 'cedula';
    document.getElementById('cedula_pasaporte').value = equipo.cedula_pasaporte || '';
    document.getElementById('inputImagen').value = equipo.imagen || '';
    updateDocumentLimit();
    if (equipo.fecha_devolucion) {
        document.getElementById('fecha_devolucion').value = equipo.fecha_devolucion.split('T')[0];
    } else {
        document.getElementById('fecha_devolucion').value = '';
    }
    document.getElementById('equipoModalLabel').innerText = 'Editar Equipo';
    document.getElementById('formAlert').classList.add('d-none');
    togglePrestadoA();
    equipoModal.show();
}

function togglePrestadoA() {
    const estado = document.getElementById('estado').value;
    const prestadoAContainer = document.getElementById('prestadoAContainer');
    const prestadoAInput = document.getElementById('prestado_a');
    const cedulaPasaporteInput = document.getElementById('cedula_pasaporte');
    const tipoDocumentoSelect = document.getElementById('tipo_documento');
    const fechaDevolucionInput = document.getElementById('fecha_devolucion');
    if (estado === 'prestado') {
        prestadoAContainer.style.display = 'block';
        prestadoAInput.required = true;
        cedulaPasaporteInput.required = true;
        fechaDevolucionInput.required = true;
    } else {
        prestadoAContainer.style.display = 'none';
        prestadoAInput.required = false;
        cedulaPasaporteInput.required = false;
        fechaDevolucionInput.required = false;
        prestadoAInput.value = '';
        tipoDocumentoSelect.value = 'cedula';
        cedulaPasaporteInput.value = '';
        fechaDevolucionInput.value = '';
        updateDocumentLimit();
    }
}

function updateDocumentLimit() {
    const tipo = document.getElementById('tipo_documento').value;
    const input = document.getElementById('cedula_pasaporte');
    if (tipo === 'cedula') {
        input.maxLength = 11;
    } else {
        input.removeAttribute('maxLength');
    }
}

async function handleCedulaBlur() {
    const cedula = document.getElementById('cedula_pasaporte').value;
    if (!cedula) return;
    try {
        const response = await fetch(`${API_URL}?cedula_pasaporte=${cedula}`);
        const data = await response.json();
        if (data.length > 0) {
            const record = data.find(r => r.prestado_a);
            if (record) {
                document.getElementById('prestado_a').value = record.prestado_a;
            }
        }
    } catch (error) {
        console.error('Error al buscar cédula:', error);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('equipoId').value;
    const payload = {
        nombre: document.getElementById('nombre').value,
        marca: document.getElementById('marca').value,
        modelo: document.getElementById('modelo').value,
        estado: document.getElementById('estado').value,
        prestado_a: document.getElementById('prestado_a').value,
        tipo_documento: document.getElementById('tipo_documento').value,
        cedula_pasaporte: document.getElementById('cedula_pasaporte').value,
        fecha_devolucion: document.getElementById('fecha_devolucion').value,
        imagen: document.getElementById('inputImagen').value
    };
    try {
        let url = API_URL;
        let method = 'POST';
        if (id) {
            url += `/${id}`;
            method = 'PUT';
        }
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Error al guardar el equipo');
        document.getElementById('equipoId').value = '';
        document.getElementById('equipoForm').reset();
        equipoModal.hide();
        loadEquipos();
    } catch (error) {
        const alert = document.getElementById('formAlert');
        alert.innerText = error.message;
        alert.classList.remove('d-none');
    }
}

async function deleteEquipo(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este equipo?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Error al eliminar');
        }
        loadEquipos();
    } catch (error) {
        alert(error.message);
    }
}

function openRetornoModal(id) {
    document.getElementById('retornoEquipoId').value = id;
    document.getElementById('retornoForm').reset();
    retornoModal.show();
}

async function handleRetornoSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('retornoEquipoId').value;
    const diagnostico = document.getElementById('diagnostico').value;
    const observaciones = document.getElementById('retornoObservaciones').value;
    
    let nuevoEstado = 'disponible';
    if (diagnostico === 'Daño Estético' || diagnostico === 'Falla Técnica') {
        nuevoEstado = 'mantenimiento';
    }
    
    try {
        const responseGet = await fetch(`${API_URL}/${id}`);
        const currentData = await responseGet.json();
        
        const updatePayload = {
            ...currentData,
            estado: nuevoEstado,
            observaciones: `Retorno (${diagnostico}): ${observaciones}`
        };
        
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Error al procesar devolución');
        
        retornoModal.hide();
        loadEquipos();
        if (currentSection === 'dashboard') loadDashboardStats();
    } catch (error) {
        alert(error.message);
    }
}

function escapeHtml(unsafe) {
    return (unsafe || '').toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showError(message) {
    const grid = document.getElementById('equiposTableBody');
    grid.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle me-2"></i>${message}</td></tr>`;
}
