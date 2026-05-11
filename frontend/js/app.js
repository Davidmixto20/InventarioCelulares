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

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        const data = await response.json();

        // Actualizar estadísticas
        actualizarStats(data);
        
        renderTable(data);
    } catch (error) {
        console.error('Error loading equipos:', error);
        showError('No se pudieron cargar los equipos.');
    }
}

function actualizarStats(equipos) {
    const total = equipos.length;
    const disponibles = equipos.filter(e => e.estado === 'disponible').length;
    const prestados = equipos.filter(e => e.estado === 'prestado').length;
    const mantenimiento = equipos.filter(e => e.estado === 'mantenimiento').length;

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statDisponibles').innerText = disponibles;
    document.getElementById('statPrestados').innerText = prestados;
    document.getElementById('statMantenimiento').innerText = mantenimiento;
    document.getElementById('registrosCount').innerText = `${total} registros`;
}

function getEquipoImagen(eq) {
    if (eq.imagen && eq.imagen.trim() !== '') {
        return eq.imagen;
    }
    // Imagen genérica elegante si el usuario no pone una
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format';
}

function renderTable(equipos) {
    const tbody = document.getElementById('equiposTableBody');
    tbody.innerHTML = '';

    if (equipos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No se encontraron equipos</td></tr>';
        return;
    }

    equipos.forEach(eq => {
        const tr = document.createElement('tr');
        const isPrestado = eq.estado === 'prestado';
        const badgeClass = isPrestado ? 'bg-warning text-dark' : (eq.estado === 'mantenimiento' ? 'bg-danger' : 'bg-success');
        
        const fecha = isPrestado && eq.fecha_prestamo
            ? new Date(eq.fecha_prestamo).toLocaleDateString()
            : '-';

        tr.innerHTML = `
            <td>
                <div class="d-flex align-items-center gap-3">
                    <div class="rounded-circle bg-glass d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                        <i class="bi bi-phone text-cyan"></i>
                    </div>
                    <span class="fw-semibold">${escapeHtml(eq.nombre)}</span>
                </div>
            </td>
            <td>
                <span class="text-secondary font-mono small">${escapeHtml(eq.marca || '-')} / ${escapeHtml(eq.modelo || '-')}</span>
            </td>
            <td>
                <span class="text-primary">${isPrestado ? escapeHtml(eq.prestado_a) : '-'}</span>
            </td>
            <td>
                <span class="text-muted font-mono small">${fecha}</span>
            </td>
            <td>
                <span class="badge ${badgeClass} rounded-pill px-3">${eq.estado}</span>
            </td>
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
    document.getElementById('inputImagen').value = equipo.imagen || '';
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
    const fechaDevolucionInput = document.getElementById('fecha_devolucion');

    if (estado === 'prestado') {
        prestadoAContainer.style.display = 'block';
        prestadoAInput.required = true;
        fechaDevolucionInput.required = true;
    } else {
        prestadoAContainer.style.display = 'none';
        prestadoAInput.required = false;
        fechaDevolucionInput.required = false;
        prestadoAInput.value = '';
        fechaDevolucionInput.value = '';
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

        if (!response.ok) {
            throw new Error(result.message || 'Error al guardar el equipo');
        }

        equipoModal.hide();
        loadEquipos();
    } catch (error) {
        const alert = document.getElementById('formAlert');
        alert.innerText = error.message;
        alert.classList.remove('d-none');
    }
}

async function deleteEquipo(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.')) return;

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
    const grid = document.getElementById('equiposGrid');
    grid.innerHTML = `<div class="col-12"><div class="alert alert-danger text-center shadow-sm border-0"><i class="bi bi-exclamation-triangle me-2"></i>${message}</div></div>`;
}
