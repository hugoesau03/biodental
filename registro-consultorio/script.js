/**
 * Script de registro de consultorio
 * Dr. Desk - Sistema de Gestión para Consultorios
 */

// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_URL = 'api.php';

// =====================================================
// ELEMENTOS DEL DOM
// =====================================================

const form = document.getElementById('registroForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoader = submitBtn.querySelector('.btn-loader');
const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const errorModalMessage = document.getElementById('errorModalMessage');

// Campos del formulario
const fields = {
    nombreConsultorio: document.getElementById('nombreConsultorio'),
    emailConsultorio: document.getElementById('emailConsultorio'),
    telefonoConsultorio: document.getElementById('telefonoConsultorio'),
    direccion: document.getElementById('direccion'),
    ciudad: document.getElementById('ciudad'),
    estado: document.getElementById('estado'),
    codigoPostal: document.getElementById('codigoPostal'),
    nombreAdmin: document.getElementById('nombreAdmin'),
    apellidosAdmin: document.getElementById('apellidosAdmin'),
    emailAdmin: document.getElementById('emailAdmin'),
    telefonoAdmin: document.getElementById('telefonoAdmin'),
    password: document.getElementById('password'),
    confirmPassword: document.getElementById('confirmPassword'),
    terminos: document.getElementById('terminos')
};

// Requisitos de contraseña
const requirements = {
    length: document.getElementById('req-length'),
    uppercase: document.getElementById('req-uppercase'),
    lowercase: document.getElementById('req-lowercase'),
    number: document.getElementById('req-number')
};

// =====================================================
// VALIDACIÓN DE CONTRASEÑA
// =====================================================

function validatePassword(password) {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password)
    };
    
    // Actualizar UI de requisitos
    Object.keys(checks).forEach(key => {
        if (requirements[key]) {
            requirements[key].classList.toggle('valid', checks[key]);
        }
    });
    
    return Object.values(checks).every(v => v);
}

// Escuchar cambios en contraseña
if (fields.password) {
    fields.password.addEventListener('input', (e) => {
        validatePassword(e.target.value);
    });
}

// =====================================================
// VALIDACIÓN DE CAMPOS
// =====================================================

function validateField(field, value) {
    let isValid = true;
    let errorMessage = '';
    
    const errorElement = document.getElementById('error' + capitalizeFirst(field.id));
    
    switch(field.id) {
        case 'nombreConsultorio':
            if (!value.trim()) {
                isValid = false;
                errorMessage = 'El nombre del consultorio es requerido';
            } else if (value.trim().length < 3) {
                isValid = false;
                errorMessage = 'El nombre debe tener al menos 3 caracteres';
            }
            break;
            
        case 'emailConsultorio':
        case 'emailAdmin':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value.trim()) {
                isValid = false;
                errorMessage = 'El correo electrónico es requerido';
            } else if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Ingresa un correo electrónico válido';
            }
            break;
            
        case 'telefonoConsultorio':
            if (!value.trim()) {
                isValid = false;
                errorMessage = 'El teléfono es requerido';
            }
            break;
            
        case 'nombreAdmin':
            if (!value.trim()) {
                isValid = false;
                errorMessage = 'El nombre es requerido';
            }
            break;
            
        case 'apellidosAdmin':
            if (!value.trim()) {
                isValid = false;
                errorMessage = 'Los apellidos son requeridos';
            }
            break;
            
        case 'password':
            if (!value) {
                isValid = false;
                errorMessage = 'La contraseña es requerida';
            } else if (!validatePassword(value)) {
                isValid = false;
                errorMessage = 'La contraseña no cumple los requisitos';
            }
            break;
            
        case 'confirmPassword':
            if (!value) {
                isValid = false;
                errorMessage = 'Confirma tu contraseña';
            } else if (value !== fields.password.value) {
                isValid = false;
                errorMessage = 'Las contraseñas no coinciden';
            }
            break;
    }
    
    // Mostrar/ocultar error
    if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.classList.toggle('visible', !isValid);
    }
    
    // Estilos del campo
    field.classList.toggle('error', !isValid);
    field.classList.toggle('success', isValid && value.trim());
    
    return isValid;
}

// Capitalizar primera letra
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// =====================================================
// EVENTOS
// =====================================================

// Validación en tiempo real para campos requeridos
const requiredFields = ['nombreConsultorio', 'emailConsultorio', 'telefonoConsultorio', 
                        'nombreAdmin', 'apellidosAdmin', 'emailAdmin', 'password', 'confirmPassword'];

requiredFields.forEach(fieldName => {
    const field = fields[fieldName];
    if (field) {
        field.addEventListener('blur', () => {
            validateField(field, field.value);
        });
        
        field.addEventListener('input', () => {
            // Limpiar error mientras escribe
            const errorElement = document.getElementById('error' + capitalizeFirst(field.id));
            if (errorElement) {
                errorElement.classList.remove('visible');
            }
            field.classList.remove('error');
        });
    }
});

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('.eye-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        `;
    } else {
        input.type = 'password';
        icon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        `;
    }
}

// Validar términos
if (fields.terminos) {
    fields.terminos.addEventListener('change', () => {
        const errorElement = document.getElementById('errorTerminos');
        if (!fields.terminos.checked) {
            errorElement.textContent = 'Debes aceptar los términos y condiciones';
            errorElement.classList.add('visible');
        } else {
            errorElement.classList.remove('visible');
        }
    });
}

// =====================================================
// ENVÍO DEL FORMULARIO
// =====================================================

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validar todos los campos
    let isFormValid = true;
    
    requiredFields.forEach(fieldName => {
        const field = fields[fieldName];
        if (field && !validateField(field, field.value)) {
            isFormValid = false;
        }
    });
    
    // Validar términos
    if (!fields.terminos.checked) {
        const errorElement = document.getElementById('errorTerminos');
        errorElement.textContent = 'Debes aceptar los términos y condiciones';
        errorElement.classList.add('visible');
        isFormValid = false;
    }
    
    if (!isFormValid) {
        // Scroll al primer error
        const firstError = document.querySelector('.error-message.visible');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    // Mostrar loading
    setLoading(true);
    
    // Preparar datos (sin plan)
    const formData = {
        consultorio: {
            nombre: fields.nombreConsultorio.value.trim(),
            email: fields.emailConsultorio.value.trim(),
            telefono: fields.telefonoConsultorio.value.trim(),
            direccion: fields.direccion.value.trim(),
            ciudad: fields.ciudad.value.trim(),
            estado: fields.estado.value.trim(),
            codigo_postal: fields.codigoPostal.value.trim()
        },
        admin: {
            nombre: fields.nombreAdmin.value.trim(),
            apellidos: fields.apellidosAdmin.value.trim(),
            email: fields.emailAdmin.value.trim(),
            telefono: fields.telefonoAdmin ? fields.telefonoAdmin.value.trim() : '',
            password: fields.password.value
        }
    };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccessModal();
        } else {
            showErrorModal(result.message || 'Ha ocurrido un error. Por favor intenta nuevamente.');
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorModal('Error de conexión. Por favor verifica tu conexión a internet e intenta nuevamente.');
    } finally {
        setLoading(false);
    }
});

// =====================================================
// UTILIDADES UI
// =====================================================

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    btnText.style.display = isLoading ? 'none' : 'inline';
    btnLoader.style.display = isLoading ? 'inline-flex' : 'none';
}

function showSuccessModal() {
    successModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function showErrorModal(message) {
    errorModalMessage.textContent = message;
    errorModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeErrorModal() {
    errorModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Cerrar modal con click fuera
[successModal, errorModal].forEach(modal => {
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
});

// Cerrar modal con Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        [successModal, errorModal].forEach(modal => {
            if (modal) {
                modal.classList.remove('active');
            }
        });
        document.body.style.overflow = '';
    }
});
