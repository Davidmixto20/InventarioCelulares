const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/equipos'
    : 'https://inventariocelulares.onrender.com/api/equipos';
let equipoModal;

document.addEventListener('DOMContentLoaded', () => {
    equipoModal = new bootstrap.Modal(document.getElementById('equipoModal'));
    loadEquipos();
    document.getElementById('searchInput').addEventListener('input', debounce(loadEquipos, 300));
    document.getElementById('filterEstado').addEventListener('change', loadEquipos);
    document.getElementById('equipoForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('cedula_pasaporte').addEventListener('blur', handleCedulaBlur);
});

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
        actualizarStats(data);
        renderTable(data);
    } catch (error) {
        showError('No se pudieron cargar los equipos.');
    }
}

function actualizarStats(equipos) {
    const total = equipos.length;
    const disponibles = equipos.filter(e => e.estado === 'disponible').length;
    const prestados = equipos.filter(e => e.estado === 'prestado').length;
    document.getElementById('statTotal').innerText = total;
    document.getElementById('statDisponibles').innerText = disponibles;
    document.getElementById('statPrestados').innerText = prestados;
    document.getElementById('registrosCount').innerText = `${total} registros`;
}

function renderTable(equipos) {
    const tbody = document.getElementById('equiposTableBody');
    tbody.innerHTML = '';
    if (equipos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No se encontraron equipos</td></tr>';
        return;
    }

    // Grouping
    const groups = {};
    equipos.forEach(eq => {
        const key = eq.estado === 'prestado' ? (eq.prestado_a || 'Sin Nombre') : 'Disponibles';
        if (!groups[key]) groups[key] = [];
        groups[key].push(eq);
    });

    // Render groups
    for (const [client, items] of Object.entries(groups)) {
        // Render header row for group
        const headerTr = document.createElement('tr');
        headerTr.style.background = 'rgba(255, 255, 255, 0.1)';
        headerTr.innerHTML = `<td colspan="7" class="fw-bold py-2 text-info"><i class="bi bi-person-fill me-2"></i>${escapeHtml(client)} <span class="badge bg-secondary ms-2">${items.length}</span></td>`;
        tbody.appendChild(headerTr);

        items.forEach(eq => {
            const tr = document.createElement('tr');
            const isPrestado = eq.estado === 'prestado';
            const badgeClass = isPrestado ? 'bg-warning text-dark' : 'bg-success';
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
                        <span class="fw-bold">${escapeHtml(eq.nombre)}</span>
                        <span class="text-secondary font-mono x-small" style="font-size: 0.7rem;">${escapeHtml(eq.marca || '-')} / ${escapeHtml(eq.modelo || '-')}</span>
                        ${imgUrl ? `
                        <div class="hover-preview shadow-lg rounded-3 border border-glass">
                            <img src="${imgUrl}" alt="Preview" style="width: 120px; height: 120px; object-fit: cover;">
                        </div>` : ''}
                    </div>
                </td>
                <td><span class="text-primary">${isPrestado ? escapeHtml(eq.prestado_a) : '-'}</span></td>
                <td><span class="text-secondary small">${isPrestado ? escapeHtml(eq.cedula_pasaporte || '-') : '-'}</span></td>
                <td><span class="text-light font-mono small">${fechaPrestamo}</span></td>
                <td><span class="text-danger font-mono small">${fechaDevolucion}</span></td>
                <td><span class="badge ${badgeClass} rounded-pill px-3">${eq.estado}</span></td>
                <td class="text-end">
                    <div class="d-flex justify-content-end gap-2">
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
