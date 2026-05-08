const API_URL = 'https://inventariocelulares.onrender.com/api/equipos';
let equipoModal;

document.addEventListener('DOMContentLoaded', () => {
    equipoModal = new bootstrap.Modal(document.getElementById('equipoModal'));
    loadEquipos();

    document.getElementById('searchInput').addEventListener('input', debounce(loadEquipos, 300));
    document.getElementById('filterEstado').addEventListener('change', loadEquipos);
    document.getElementById('equipoForm').addEventListener('submit', handleFormSubmit);
});

// Utility to debounce search
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

        renderTable(data);
    } catch (error) {
        console.error('Error loading equipos:', error);
        showError('No se pudieron cargar los equipos. Verifica que el servidor backend esté corriendo.');
    }
}

function renderTable(equipos) {
    const grid = document.getElementById('equiposGrid');
    grid.innerHTML = '';

    if (equipos.length === 0) {
        grid.innerHTML = '<div class="col-12"><div class="alert alert-info text-center shadow-sm border-0"><i class="bi bi-info-circle me-2"></i>No se encontraron equipos</div></div>';
        return;
    }

    equipos.forEach(eq => {
        const div = document.createElement('div');
        div.className = 'col-12 col-md-6 col-lg-4';

        const isPrestado = eq.estado === 'prestado';
        const badgeClass = isPrestado ? 'bg-warning text-dark' : 'bg-success';

        const fecha = isPrestado && eq.fecha_prestamo
            ? new Date(eq.fecha_prestamo).toLocaleDateString()
            : 'N/A';

        div.innerHTML = `
            <div class="card h-100 shadow-sm border-0 equipo-card rounded-4">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title fw-bold mb-0 text-truncate" title="${escapeHtml(eq.nombre)}">
                            ${escapeHtml(eq.nombre)}
                        </h5>
                        <span class="badge ${badgeClass} rounded-pill px-3 py-2">${eq.estado}</span>
                    </div>
                    
                    <div class="mb-3 text-muted small">
                        <div class="d-flex align-items-center mb-2">
                            <i class="bi bi-tag text-primary me-2"></i>
                            <span>${escapeHtml(eq.marca || '-')} / ${escapeHtml(eq.modelo || '-')}</span>
                        </div>
                        <div class="d-flex align-items-center mb-2">
                            <i class="bi bi-person text-primary me-2"></i>
                            <span>${isPrestado ? escapeHtml(eq.prestado_a || '-') : 'N/A'}</span>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="bi bi-calendar3 text-primary me-2"></i>
                            <span>${fecha}</span>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-top-0 p-4 pt-0 d-flex justify-content-end gap-2">
                    <button class="btn btn-light btn-sm rounded-pill px-3 shadow-sm text-primary fw-semibold" onclick='editEquipo(${JSON.stringify(eq).replace(/'/g, "\\'")})'>
                        <i class="bi bi-pencil me-1"></i> Editar
                    </button>
                    <button class="btn btn-light btn-sm rounded-pill px-3 shadow-sm text-danger fw-semibold" onclick="deleteEquipo(${eq.id})">
                        <i class="bi bi-trash me-1"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(div);
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

    document.getElementById('equipoModalLabel').innerText = 'Editar Equipo';
    document.getElementById('formAlert').classList.add('d-none');

    togglePrestadoA();
    equipoModal.show();
}

function togglePrestadoA() {
    const estado = document.getElementById('estado').value;
    const prestadoAContainer = document.getElementById('prestadoAContainer');
    const prestadoAInput = document.getElementById('prestado_a');

    if (estado === 'prestado') {
        prestadoAContainer.style.display = 'block';
        prestadoAInput.required = true;
    } else {
        prestadoAContainer.style.display = 'none';
        prestadoAInput.required = false;
        prestadoAInput.value = '';
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
        prestado_a: document.getElementById('prestado_a').value
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
