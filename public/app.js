// app.js - SPA minimal para gestionar clientes, vehiculos y ordenes
const $ = (sel) => document.querySelector(sel);
const content = $('#content');

// Navigation
$('#nav-clientes').addEventListener('click', () => showClientes());
$('#nav-vehiculos').addEventListener('click', () => showVehiculos());
$('#nav-ordenes').addEventListener('click', () => showOrdenes());

// Helpers
async function api(path, opts) {
  const res = await fetch(path, opts);
  if (!res.ok) {
    const err = await res.json().catch(()=>({error:res.statusText}));
    throw err;
  }
  return res.json().catch(()=>null);
}

// Clientes
async function showClientes() {
  content.innerHTML = `
    <div class="d-flex justify-content-between mb-3">
      <h2>Clientes</h2>
      <button id="btn-nuevo-cliente" class="btn btn-success">Nuevo cliente</button>
    </div>
    <div id="clientes-list"></div>
  `;
  $('#btn-nuevo-cliente').addEventListener('click', () => formNuevoCliente());
  const clientes = await api('/clientes');
  const list = $('#clientes-list');
  list.innerHTML = clientes.map(c => `
    <div class="card p-3">
      <div class="d-flex justify-content-between">
        <div>
          <strong>${escapeHtml(c.nombre)}</strong>
          <div class="small-muted">Tel: ${escapeHtml(c.telefono||'--')} • ${escapeHtml(c.correo||'--')}</div>
        </div>
        <div>
          <button class="btn btn-sm btn-primary me-2" data-id="${c.id}" onclick="editCliente(${c.id})">Editar</button>
          <button class="btn btn-sm btn-danger" data-id="${c.id}" onclick="deleteCliente(${c.id})">Borrar</button>
        </div>
      </div>
    </div>
  `).join('');
}

function formNuevoCliente() {
  content.innerHTML = `
    <h2>Nuevo Cliente</h2>
    <form id="form-cliente">
      <div class="mb-3">
        <label class="form-label">Nombre</label>
        <input name="nombre" class="form-control" required />
      </div>
      <div class="mb-3">
        <label class="form-label">Teléfono</label>
        <input name="telefono" class="form-control" />
      </div>
      <div class="mb-3">
        <label class="form-label">Correo</label>
        <input name="correo" class="form-control" />
      </div>
      <button class="btn btn-primary">Guardar</button>
      <button type="button" class="btn btn-link" id="cancel-cliente">Cancelar</button>
    </form>
  `;
  $('#cancel-cliente').addEventListener('click', showClientes);
  $('#form-cliente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    await api('/clientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    showClientes();
  });
}

window.editCliente = async function(id) {
  const c = await api(`/clientes/${id}`);
  content.innerHTML = `
    <h2>Editar Cliente</h2>
    <form id="form-cliente">
      <div class="mb-3">
        <label class="form-label">Nombre</label>
        <input name="nombre" class="form-control" value="${escapeHtml(c.nombre)}" required />
      </div>
      <div class="mb-3">
        <label class="form-label">Teléfono</label>
        <input name="telefono" class="form-control" value="${escapeHtml(c.telefono||'')}" />
      </div>
      <div class="mb-3">
        <label class="form-label">Correo</label>
        <input name="correo" class="form-control" value="${escapeHtml(c.correo||'')}" />
      </div>
      <button class="btn btn-primary">Guardar</button>
      <button type="button" class="btn btn-link" id="cancel-cliente">Cancelar</button>
    </form>
  `;
  $('#cancel-cliente').addEventListener('click', showClientes);
  $('#form-cliente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    await api(`/clientes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    showClientes();
  });
}

window.deleteCliente = async function(id) {
  if (!confirm('Borrar cliente y vehículos asociados?')) return;
  await api(`/clientes/${id}`, { method: 'DELETE' });
  showClientes();
}

// Vehículos
async function showVehiculos() {
  content.innerHTML = `
    <div class="d-flex justify-content-between mb-3">
      <h2>Vehículos</h2>
      <button id="btn-nuevo-vehiculo" class="btn btn-success">Nuevo vehículo</button>
    </div>
    <div id="vehiculos-list"></div>
  `;
  $('#btn-nuevo-vehiculo').addEventListener('click', () => formNuevoVehiculo());
  const vehiculos = await api('/vehiculos');
  const list = $('#vehiculos-list');
  list.innerHTML = vehiculos.map(v => `
    <div class="card p-3">
      <div class="d-flex justify-content-between">
        <div>
          <strong>${escapeHtml(v.marca||'')} ${escapeHtml(v.modelo||'')}</strong>
          <div class="small-muted">Cliente: ${escapeHtml(v.cliente_id)} • Placas: ${escapeHtml(v.placas||'--')}</div>
        </div>
        <div>
          <button class="btn btn-sm btn-primary me-2" onclick="editVehiculo(${v.id})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="deleteVehiculo(${v.id})">Borrar</button>
        </div>
      </div>
    </div>
  `).join('');
}

function formNuevoVehiculo() {
  content.innerHTML = `
    <h2>Nuevo Vehículo</h2>
    <form id="form-vehiculo">
      <div class="mb-3">
        <label class="form-label">Cliente (ID)</label>
        <input name="cliente_id" type="number" class="form-control" required />
      </div>
      <div class="mb-3">
        <label class="form-label">Marca</label>
        <input name="marca" class="form-control" />
      </div>
      <div class="mb-3">
        <label class="form-label">Modelo</label>
        <input name="modelo" class="form-control" />
      </div>
      <div class="mb-3">
        <label class="form-label">Placas</label>
        <input name="placas" class="form-control" />
      </div>
      <button class="btn btn-primary">Guardar</button>
      <button type="button" class="btn btn-link" id="cancel-vehiculo">Cancelar</button>
    </form>
  `;
  $('#cancel-vehiculo').addEventListener('click', showVehiculos);
  $('#form-vehiculo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    await api('/vehiculos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    showVehiculos();
  });
}

window.editVehiculo = async function(id) {
  const v = await api(`/vehiculos/${id}`);
  content.innerHTML = `
    <h2>Editar Vehículo</h2>
    <form id="form-vehiculo">
      <div class="mb-3">
        <label class="form-label">Marca</label>
        <input name="marca" class="form-control" value="${escapeHtml(v.marca||'')}" />
      </div>
      <div class="mb-3">
        <label class="form-label">Modelo</label>
        <input name="modelo" class="form-control" value="${escapeHtml(v.modelo||'')}" />
      </div>
      <div class="mb-3">
        <label class="form-label">Placas</label>
        <input name="placas" class="form-control" value="${escapeHtml(v.placas||'')}" />
      </div>
      <button class="btn btn-primary">Guardar</button>
      <button type="button" class="btn btn-link" id="cancel-vehiculo">Cancelar</button>
    </form>
  `;
  $('#cancel-vehiculo').addEventListener('click', showVehiculos);
  $('#form-vehiculo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    await api(`/vehiculos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    showVehiculos();
  });
}

window.deleteVehiculo = async function(id) {
  if (!confirm('Borrar vehículo?')) return;
  await api(`/vehiculos/${id}`, { method: 'DELETE' });
  showVehiculos();
}

// Órdenes
async function showOrdenes() {
  content.innerHTML = `
    <div class="d-flex justify-content-between mb-3">
      <h2>Órdenes</h2>
      <button id="btn-nueva-orden" class="btn btn-success">Nueva orden</button>
    </div>
    <div id="ordenes-list"></div>
  `;
  $('#btn-nueva-orden').addEventListener('click', () => formNuevaOrden());
  const ordenes = await api('/ordenes');
  const list = $('#ordenes-list');
  list.innerHTML = ordenes.map(o => `
    <div class="card p-3">
      <div class="d-flex">
        <div style="flex:1">
          <strong>#${o.id} — ${escapeHtml(o.servicio||'Sin servicio')}</strong>
          <div class="small-muted">Cliente: ${escapeHtml(o.cliente)} • Vehículo: ${escapeHtml(o.vehiculo)} • Total: ${escapeHtml(o.total||'0')}</div>
          <div>${escapeHtml(o.descripcion||'')}</div>
          ${o.qr?`<img src="${o.qr}" class="preview-img mt-2" />`:''}
        </div>
        <div class="text-end">
          <button class="btn btn-sm btn-primary mb-2" onclick="viewOrden(${o.id})">Ver</button>
          <button class="btn btn-sm btn-danger" onclick="deleteOrden(${o.id})">Borrar</button>
        </div>
      </div>
    </div>
  `).join('');
}

function formNuevaOrden() {
  content.innerHTML = `
    <h2>Nueva Orden</h2>
    <form id="form-orden">
      <div class="mb-3">
        <label class="form-label">Cliente (ID)</label>
        <input name="cliente_id" type="number" class="form-control" required />
      </div>
      <div class="mb-3">
        <label class="form-label">Vehículo (ID)</label>
        <input name="vehiculo_id" type="number" class="form-control" required />
      </div>
      <div class="mb-3">
        <label class="form-label">Servicio</label>
        <input name="servicio" class="form-control" />
      </div>
      <div class="mb-3">
        <label class="form-label">Descripción</label>
        <textarea name="descripcion" class="form-control"></textarea>
      </div>
      <div class="mb-3">
        <label class="form-label">Total</label>
        <input name="total" type="number" step="0.01" class="form-control" />
      </div>
      <div class="mb-3">
        <label class="form-label">Imágenes (max 5)</label>
        <input name="images" type="file" multiple class="form-control" />
      </div>
      <button class="btn btn-primary">Guardar</button>
      <button type="button" class="btn btn-link" id="cancel-orden">Cancelar</button>
    </form>
  `;
  $('#cancel-orden').addEventListener('click', showOrdenes);
  $('#form-orden').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    // append files correctly
    const files = form.querySelector('input[name="images"]').files;
    for (let i=0;i<files.length;i++) fd.append('images', files[i]);
    const res = await fetch('/ordenes', { method: 'POST', body: fd });
    if (!res.ok) { alert('Error al crear orden'); return; }
    showOrdenes();
  });
}

window.viewOrden = async function(id) {
  const o = await api(`/ordenes/${id}`);
  content.innerHTML = `
    <h2>Orden #${o.id}</h2>
    <div class="card p-3">
      <div><strong>Cliente:</strong> ${escapeHtml(o.cliente)}</div>
      <div><strong>Vehículo:</strong> ${escapeHtml(o.vehiculo)}</div>
      <div><strong>Servicio:</strong> ${escapeHtml(o.servicio||'')}</div>
      <div><strong>Descripción:</strong> ${escapeHtml(o.descripcion||'')}</div>
      <div><strong>Total:</strong> ${escapeHtml(o.total||'0')}</div>
      <div class="mt-3">${(o.imagenes||[]).map(p=>`<img src="${p}" class="preview-img me-2" />`).join('')}</div>
      <div class="mt-3">${o.qr?`<div><strong>QR</strong><br/><img src="${o.qr}" /></div>`:''}</div>
    </div>
    <div class="mt-3">
      <button class="btn btn-secondary" onclick="showOrdenes()">Volver</button>
    </div>
  `;
}

window.deleteOrden = async function(id) {
  if (!confirm('Borrar orden?')) return;
  await api(`/ordenes/${id}`, { method: 'DELETE' });
  showOrdenes();
}

// Util
function escapeHtml(str){ if(str==null) return ''; return String(str).replace(/[&<>"]+/g, (s)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[s])); }

// Inicial
showOrdenes();
