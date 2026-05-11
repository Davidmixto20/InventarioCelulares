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
                <div class="position-relative bg-light d-flex align-items-center justify-content-center" style="height: 200px; background-color: #f8f9fa;">
                    <img src="${eq.imagen || 'https://via.placeholder.com/200x150?text=Sin+Imagen'}" 
                         alt="${escapeHtml(eq.nombre)}" 
                         class="img-fluid" 
                         style="max-height: 100%; object-fit: contain; padding: 15px;">
                    <span class="badge ${badgeClass} rounded-pill px-3 py-2 position-absolute top-0 end-0 m-3 shadow-sm">${eq.estado}</span>
                </div>
                
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
}