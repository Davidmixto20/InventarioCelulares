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
        
        const fechaDevolucion = isPrestado && eq.fecha_devolucion
            ? new Date(eq.fecha_devolucion).toLocaleDateString()
            : 'N/A';

        div.innerHTML = `
            <div class="card h-100 shadow-sm border-0 equipo-card rounded-4 overflow-hidden">
<<<<<<< HEAD
                <div class="position-relative bg-light d-flex align-items-center justify-content-center" style="height: 200px; background-color: #f8f9fa;">
                    <img src="${eq.imagen || 'https://via.placeholder.com/200x150?text=Sin+Imagen'}" 
                         alt="${escapeHtml(eq.nombre)}" 
                         class="img-fluid" 
                         style="max-height: 100%; object-fit: contain; padding: 15px;">
                    <span class="badge ${badgeClass} rounded-pill px-3 py-2 position-absolute top-0 end-0 m-3 shadow-sm">${eq.estado}</span>
                </div>
                
=======
                ${eq.imagen ? `<img src="${escapeHtml(eq.imagen)}" class="card-img-top object-fit-cover" style="height: 180px;" alt="${escapeHtml(eq.nombre)}">` : ''}
>>>>>>> 8ae7967ac57e7afd383e520ae1c1a5be7083080c
                <div class="card-body p-4">
                    <h5 class="card-title fw-bold mb-3 text-truncate" title="${escapeHtml(eq.nombre)}">
                        ${escapeHtml(eq.nombre)}
                    </h5>
                    
                    <div class="mb-3 text-muted small">
                        <div class="d-flex align-items-center mb-2">
                            <i class="bi bi-tag text-primary me-2"></i>
                            <span>${escapeHtml(eq.marca || '-')} / ${escapeHtml(eq.modelo || '-')}</span>
                        </div>
                        <div class="d-flex align-items-center mb-2">
                            <i class="bi bi-person text-primary me-2"></i>
                            <span>${isPrestado ? escapeHtml(eq.prestado_a || '-') : 'N/A'}</span>
                        </div>
                        <div class="d-flex align-items-center mb-2">
                            <i class="bi bi-calendar3 text-primary me-2"></i>
                            <span>Prestado: ${fecha}</span>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="bi bi-calendar-x text-danger me-2"></i>
                            <span>Límite: ${fechaDevolucion}</span>
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
<<<<<<< HEAD
}
=======
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
    document.getElementById('imagen').value = equipo.imagen || '';
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
        imagen: document.getElementById('imagen').value
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
>>>>>>> 8ae7967ac57e7afd383e520ae1c1a5be7083080c
