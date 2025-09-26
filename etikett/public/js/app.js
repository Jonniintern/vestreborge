// Global variables
let canvas, ctx;
let currentTemplate = 'egen';
let backgroundImage = null;
let selectedFrame = 'none';
let frameImage = null;
let elements = [];
let selectedElement = null;
let isDragging = false;
let dragStart = { x: 0, y: 0 };

// Template configurations - Updated for 898x1205 canvas (76mm x 102mm at 300 DPI)
const templates = {
    egen: {
        name: 'Egen',
        background: null,
        defaultElements: []
    },
    mal1: {
        name: 'Klassisk Gård',
        background: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="898" height="1205" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#F5F5DC"/>
                        <stop offset="50%" style="stop-color:#F5DEB3"/>
                        <stop offset="100%" style="stop-color:#FAF9F6"/>
                    </linearGradient>
                    <pattern id="woodGrain" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <rect width="40" height="40" fill="#F5DEB3"/>
                        <path d="M0 20 Q20 10 40 20 Q20 30 0 20" stroke="#8B4513" stroke-width="0.5" opacity="0.3" fill="none"/>
                    </pattern>
                </defs>
                <rect width="898" height="1205" fill="url(#grad1)"/>
                <rect x="0" y="0" width="898" height="120" fill="url(#woodGrain)" opacity="0.6"/>
                <rect x="0" y="1085" width="898" height="120" fill="url(#woodGrain)" opacity="0.6"/>
                <circle cx="150" cy="200" r="80" fill="#DAA520" opacity="0.4"/>
                <circle cx="748" cy="400" r="60" fill="#A0442C" opacity="0.3"/>
                <text x="449" y="80" text-anchor="middle" font-family="Georgia" font-size="36" fill="#8B4513" font-weight="bold">🌾 Vestre Borge Gård 🌾</text>
                <text x="449" y="1150" text-anchor="middle" font-family="Georgia" font-size="24" fill="#A0442C" font-style="italic">Naturens beste fra gården vår</text>
            </svg>
        `),
        defaultElements: [
            { type: 'text', content: 'Produkt navn', x: 449, y: 600, fontSize: 48, fontFamily: 'Georgia', color: '#8B4513' }
        ]
    },
    mal2: {
        name: 'Moderne Økologisk',
        background: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="898" height="1205" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#F5F5DC"/>
                        <stop offset="50%" style="stop-color:#ffffff"/>
                        <stop offset="100%" style="stop-color:#F0F8FF"/>
                    </linearGradient>
                </defs>
                <rect width="898" height="1205" fill="url(#grad2)"/>
                <rect x="0" y="0" width="898" height="150" fill="#355E3B"/>
                <rect x="0" y="1055" width="898" height="150" fill="#355E3B"/>
                <circle cx="449" cy="75" r="40" fill="#DAA520"/>
                <text x="449" y="90" text-anchor="middle" font-family="Georgia" font-size="32" fill="white" font-weight="bold">🌱 ØKOLOGISK 🌱</text>
                <text x="449" y="1140" text-anchor="middle" font-family="Georgia" font-size="26" fill="white" font-weight="bold">100% Naturlig</text>
            </svg>
        `),
        defaultElements: [
            { type: 'text', content: 'Produkt navn', x: 449, y: 600, fontSize: 44, fontFamily: 'Georgia', color: '#355E3B' }
        ]
    },
    mal3: {
        name: 'Blomster & Natur',
        background: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="898" height="1205" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="flowerGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" style="stop-color:#fff8f0"/>
                        <stop offset="100%" style="stop-color:#F5F5DC"/>
                    </radialGradient>
                </defs>
                <rect width="898" height="1205" fill="url(#flowerGrad)"/>
                <circle cx="180" cy="200" r="45" fill="#ffb347" opacity="0.7"/>
                <circle cx="718" cy="300" r="52" fill="#ff6b9d" opacity="0.6"/>
                <circle cx="250" cy="900" r="38" fill="#c44569" opacity="0.6"/>
                <circle cx="650" cy="1000" r="42" fill="#f8b500" opacity="0.7"/>
                <circle cx="449" cy="150" r="35" fill="#DAA520" opacity="0.8"/>
                <path d="M 100 1100 Q 449 950 798 1100" stroke="#355E3B" stroke-width="6" fill="none" opacity="0.5"/>
                <path d="M 0 300 Q 224 200 449 300 Q 674 400 898 300" stroke="#A0442C" stroke-width="4" fill="none" opacity="0.4"/>
                <text x="449" y="100" text-anchor="middle" font-family="Georgia" font-size="32" fill="#8B4513" font-style="italic" font-weight="bold">🌻 Naturens Gave 🌻</text>
                <text x="449" y="1160" text-anchor="middle" font-family="Georgia" font-size="24" fill="#A0442C" font-style="italic">Med kjærlighet fra naturen</text>
            </svg>
        `),
        defaultElements: [
            { type: 'text', content: 'Produkt navn', x: 449, y: 600, fontSize: 46, fontFamily: 'Georgia', color: '#A0442C' }
        ]
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeCanvas();
    setupEventListeners();
    setActiveTemplate('egen');
});

function initializeCanvas() {
    canvas = document.getElementById('labelCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size for 76mm x 102mm at 300 DPI (print quality)
    // 76mm = 2.992 inches, 102mm = 4.016 inches
    // At 300 DPI: 898 x 1205 pixels
    const canvasWidth = 898;
    const canvasHeight = 1205;
    
    // Set high DPI rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    
    // Scale canvas display size to fit container while maintaining aspect ratio
    const container = document.getElementById('canvasContainer');
    const containerRect = container.getBoundingClientRect();
    const aspectRatio = canvasWidth / canvasHeight;
    
    let displayWidth = containerRect.width - 40; // Account for padding/border
    let displayHeight = displayWidth / aspectRatio;
    
    if (displayHeight > containerRect.height - 40) {
        displayHeight = containerRect.height - 40;
        displayWidth = displayHeight * aspectRatio;
    }
    
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    ctx.scale(dpr, dpr);
    
    redrawCanvas();
}

function setupEventListeners() {
    // Template buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setActiveTemplate(this.dataset.template);
        });
    });

    // Frame buttons
    document.querySelectorAll('.frame-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setActiveFrame(this.dataset.frame);
        });
    });

    // File input for own image
    document.getElementById('backgroundImage').addEventListener('change', handleImageUpload);

    // Canvas interactions
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    // Text controls
    document.getElementById('textContent').addEventListener('input', updateSelectedText);
    document.getElementById('fontFamily').addEventListener('change', updateSelectedText);
    document.getElementById('fontSize').addEventListener('input', updateSelectedText);
    document.getElementById('textColor').addEventListener('change', updateSelectedText);

    // Action buttons
    document.getElementById('submitLabel').addEventListener('click', submitLabel);
    document.getElementById('downloadLabel').addEventListener('click', downloadLabel);
}

function setActiveTemplate(templateId) {
    currentTemplate = templateId;
    
    // Update UI
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-template="${templateId}"]`).classList.add('active');

    // Show/hide image upload and frame selector
    const imageUpload = document.getElementById('ownImageUpload');
    const frameSelector = document.getElementById('frameSelector');
    
    if (templateId === 'egen') {
        imageUpload.style.display = 'block';
        // Show frame selector only if an image is uploaded
        if (backgroundImage) {
            frameSelector.style.display = 'block';
        }
    } else {
        imageUpload.style.display = 'none';
        frameSelector.style.display = 'none';
    }

    // Load template
    loadTemplate(templateId);
}

function setActiveFrame(frameId) {
    selectedFrame = frameId;
    
    // Update UI
    document.querySelectorAll('.frame-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-frame="${frameId}"]`).classList.add('active');

    // Load frame if not "none"
    if (frameId !== 'none') {
        loadFrame(frameId);
    } else {
        frameImage = null;
        redrawCanvas();
    }
}

function loadTemplate(templateId) {
    const template = templates[templateId];
    elements = [...template.defaultElements];
    
    if (template.background && templateId !== 'egen') {
        const img = new Image();
        img.onload = function() {
            backgroundImage = img;
            showCanvas();
            redrawCanvas();
        };
        img.src = template.background;
    } else if (templateId === 'egen') {
        backgroundImage = null;
        hideCanvas();
    } else {
        backgroundImage = null;
        showCanvas();
        redrawCanvas();
    }
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showStatus('Vennligst velg en gyldig bildefil (JPG, PNG, GIF, etc.)', 'error');
            return;
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showStatus('Bildet er for stort. Maksimal størrelse er 10MB.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Enable CORS for canvas
            img.onload = function() {
                backgroundImage = img;
                showCanvas();
                redrawCanvas();
                
                // Show frame selector
                const frameSelector = document.getElementById('frameSelector');
                frameSelector.style.display = 'block';
                
                // Show success message
                showStatus('Bilde lastet opp! Velg en ramme eller klikk på lerretet for å legge til tekst.', 'success');
            };
            img.onerror = function() {
                showStatus('Kunne ikke laste bildet. Prøv et annet bilde.', 'error');
            };
            img.src = event.target.result;
        };
        reader.onerror = function() {
            showStatus('Feil ved lesing av filen. Prøv igjen.', 'error');
        };
        reader.readAsDataURL(file);
        
        // Update label with filename
        const label = e.target.nextElementSibling;
        label.innerHTML = `<span class="icon">✅</span> ${file.name}`;
        label.style.background = '#F5DEB3';
        label.style.borderColor = '#355E3B';
        label.style.color = '#355E3B';
    }
}

function loadFrame(frameId) {
    // Create frame directly using canvas drawing instead of loading external SVG
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = 898;
    frameCanvas.height = 1205;
    const frameCtx = frameCanvas.getContext('2d');
    
    // Draw frame based on selected type
    if (frameId === 'frame1') {
        // Klassisk tre-ramme
        drawWoodenFrame(frameCtx, 898, 1205);
    } else if (frameId === 'frame2') {
        // Industriell metal-ramme
        drawMetalFrame(frameCtx, 898, 1205);
    } else if (frameId === 'frame3') {
        // Vintage ornate-ramme
        drawVintageFrame(frameCtx, 898, 1205);
    }
    
    // Convert to image
    const img = new Image();
    img.onload = function() {
        frameImage = img;
        redrawCanvas();
    };
    img.src = frameCanvas.toDataURL();
}

function drawWoodenFrame(ctx, width, height) {
    // Outer wooden frame
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, width, height);
    
    // Inner frame layers
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(15, 15, width - 30, height - 30);
    
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(30, 30, width - 60, height - 60);
    
    // Clear inner area (transparent)
    ctx.clearRect(60, 60, width - 120, height - 120);
    
    // Corner decorations
    ctx.fillStyle = '#DAA520';
    ctx.beginPath();
    ctx.arc(60, 60, 15, 0, Math.PI * 2);
    ctx.arc(width - 60, 60, 15, 0, Math.PI * 2);
    ctx.arc(60, height - 60, 15, 0, Math.PI * 2);
    ctx.arc(width - 60, height - 60, 15, 0, Math.PI * 2);
    ctx.fill();
}

function drawMetalFrame(ctx, width, height) {
    // Outer metal frame
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#C0C0C0');
    gradient.addColorStop(0.5, '#808080');
    gradient.addColorStop(1, '#A9A9A9');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Inner frame layers
    ctx.fillStyle = '#696969';
    ctx.fillRect(8, 8, width - 16, height - 16);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(16, 16, width - 32, height - 32);
    
    // Clear inner area
    ctx.clearRect(40, 40, width - 80, height - 80);
    
    // Corner bolts
    ctx.fillStyle = '#2F4F4F';
    ctx.beginPath();
    ctx.arc(20, 20, 8, 0, Math.PI * 2);
    ctx.arc(width - 20, 20, 8, 0, Math.PI * 2);
    ctx.arc(20, height - 20, 8, 0, Math.PI * 2);
    ctx.arc(width - 20, height - 20, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Bolt highlights
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.arc(20, 20, 4, 0, Math.PI * 2);
    ctx.arc(width - 20, 20, 4, 0, Math.PI * 2);
    ctx.arc(20, height - 20, 4, 0, Math.PI * 2);
    ctx.arc(width - 20, height - 20, 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawVintageFrame(ctx, width, height) {
    // Outer ornate frame
    const radialGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    radialGrad.addColorStop(0, '#F5F5DC');
    radialGrad.addColorStop(0.7, '#DEB887');
    radialGrad.addColorStop(1, '#D2B48C');
    
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, width, height);
    
    // Ornate pattern layer
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(12, 12, width - 24, height - 24);
    
    ctx.fillStyle = radialGrad;
    ctx.fillRect(24, 24, width - 48, height - 48);
    
    // Clear inner area
    ctx.clearRect(50, 50, width - 100, height - 100);
    
    // Corner flourishes
    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    // Top-left flourish
    ctx.moveTo(25, 25);
    ctx.quadraticCurveTo(40, 10, 55, 25);
    ctx.quadraticCurveTo(40, 40, 25, 25);
    ctx.closePath();
    
    // Top-right flourish
    ctx.moveTo(width - 25, 25);
    ctx.quadraticCurveTo(width - 40, 10, width - 55, 25);
    ctx.quadraticCurveTo(width - 40, 40, width - 25, 25);
    ctx.closePath();
    
    // Bottom-left flourish
    ctx.moveTo(25, height - 25);
    ctx.quadraticCurveTo(40, height - 10, 55, height - 25);
    ctx.quadraticCurveTo(40, height - 40, 25, height - 25);
    ctx.closePath();
    
    // Bottom-right flourish
    ctx.moveTo(width - 25, height - 25);
    ctx.quadraticCurveTo(width - 40, height - 10, width - 55, height - 25);
    ctx.quadraticCurveTo(width - 40, height - 40, width - 25, height - 25);
    ctx.closePath();
    
    ctx.fill();
    
    // Vintage roses in corners
    ctx.fillStyle = '#DC143C';
    ctx.beginPath();
    ctx.arc(100, 100, 12, 0, Math.PI * 2);
    ctx.arc(width - 100, 100, 12, 0, Math.PI * 2);
    ctx.arc(100, height - 100, 12, 0, Math.PI * 2);
    ctx.arc(width - 100, height - 100, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#B22222';
    ctx.beginPath();
    ctx.arc(100, 100, 6, 0, Math.PI * 2);
    ctx.arc(width - 100, 100, 6, 0, Math.PI * 2);
    ctx.arc(100, height - 100, 6, 0, Math.PI * 2);
    ctx.arc(width - 100, height - 100, 6, 0, Math.PI * 2);
    ctx.fill();
}

function showCanvas() {
    document.getElementById('canvasContainer').classList.add('active');
    document.getElementById('canvasPlaceholder').style.display = 'none';
    canvas.style.display = 'block';
}

function hideCanvas() {
    document.getElementById('canvasContainer').classList.remove('active');
    document.getElementById('canvasPlaceholder').style.display = 'block';
    canvas.style.display = 'none';
}

function redrawCanvas() {
    const canvasWidth = 898;
    const canvasHeight = 1205;
    
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw background
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
    } else {
        // Default background with warm colors
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, '#F5F5DC'); // Beige
        gradient.addColorStop(0.5, '#FAF9F6'); // Off-white
        gradient.addColorStop(1, '#F5DEB3'); // Wheat
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Add subtle border
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20);
    }
    
    // Draw text elements
    elements.forEach((element, index) => {
        drawElement(element, index === selectedElement);
    });
    
    // Draw frame on top if selected
    if (frameImage && selectedFrame !== 'none') {
        ctx.drawImage(frameImage, 0, 0, canvasWidth, canvasHeight);
    }
}

function drawElement(element, isSelected) {
    if (element.type === 'text') {
        ctx.font = `${element.fontSize}px ${element.fontFamily}`;
        ctx.fillStyle = element.color;
        ctx.textAlign = 'center';
        ctx.fillText(element.content, element.x, element.y);
        
        if (isSelected) {
            // Draw selection border
            const metrics = ctx.measureText(element.content);
            const width = metrics.width;
            const height = element.fontSize;
            ctx.strokeStyle = '#007acc';
            ctx.lineWidth = 2;
            ctx.strokeRect(element.x - width/2 - 5, element.y - height + 5, width + 10, height + 10);
        }
    }
}

function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = 898;
    const canvasHeight = 1205;
    
    const x = (e.clientX - rect.left) * (canvasWidth / rect.width);
    const y = (e.clientY - rect.top) * (canvasHeight / rect.height);
    
    // Check if clicking on existing element
    let clickedElement = -1;
    for (let i = elements.length - 1; i >= 0; i--) {
        if (isPointInElement(x, y, elements[i])) {
            clickedElement = i;
            break;
        }
    }
    
    if (clickedElement >= 0) {
        selectElement(clickedElement);
    } else {
        // Add new text element
        const newElement = {
            type: 'text',
            content: 'Ny tekst',
            x: x,
            y: y,
            fontSize: 36,
            fontFamily: 'Georgia',
            color: '#8B4513'
        };
        elements.push(newElement);
        selectElement(elements.length - 1);
        redrawCanvas();
    }
}

function isPointInElement(x, y, element) {
    if (element.type === 'text') {
        // Approximate text bounds
        const width = element.content.length * element.fontSize * 0.6;
        const height = element.fontSize;
        return x >= element.x - width/2 && x <= element.x + width/2 &&
               y >= element.y - height && y <= element.y;
    }
    return false;
}

function selectElement(index) {
    selectedElement = index;
    const element = elements[index];
    
    // Show text controls
    document.getElementById('textControls').style.display = 'block';
    
    // Update controls
    document.getElementById('textContent').value = element.content;
    document.getElementById('fontFamily').value = element.fontFamily;
    document.getElementById('fontSize').value = element.fontSize;
    document.getElementById('textColor').value = element.color;
    
    redrawCanvas();
}

function updateSelectedText() {
    if (selectedElement !== null) {
        const element = elements[selectedElement];
        element.content = document.getElementById('textContent').value;
        element.fontFamily = document.getElementById('fontFamily').value;
        element.fontSize = parseInt(document.getElementById('fontSize').value);
        element.color = document.getElementById('textColor').value;
        redrawCanvas();
    }
}

function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = 898;
    const canvasHeight = 1205;
    
    const x = (e.clientX - rect.left) * (canvasWidth / rect.width);
    const y = (e.clientY - rect.top) * (canvasHeight / rect.height);
    
    for (let i = elements.length - 1; i >= 0; i--) {
        if (isPointInElement(x, y, elements[i])) {
            selectedElement = i;
            isDragging = true;
            dragStart = { x: x - elements[i].x, y: y - elements[i].y };
            canvas.style.cursor = 'grabbing';
            break;
        }
    }
}

function handleMouseMove(e) {
    if (isDragging && selectedElement !== null) {
        const rect = canvas.getBoundingClientRect();
        const canvasWidth = 898;
        const canvasHeight = 1205;
        
        const x = (e.clientX - rect.left) * (canvasWidth / rect.width);
        const y = (e.clientY - rect.top) * (canvasHeight / rect.height);
        
        elements[selectedElement].x = x - dragStart.x;
        elements[selectedElement].y = y - dragStart.y;
        redrawCanvas();
    }
}

function handleMouseUp() {
    isDragging = false;
    canvas.style.cursor = 'crosshair';
}

function downloadLabel() {
    const link = document.createElement('a');
    link.download = 'etikett-vestre-borge.png';
    link.href = canvas.toDataURL();
    link.click();
}

async function submitLabel() {
    // Validate form
    const customerName = document.getElementById('customerName').value.trim();
    const customerEmail = document.getElementById('customerEmail').value.trim();
    
    if (!customerName || !customerEmail) {
        showStatus('Vennligst fyll ut navn og e-post adresse', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = document.getElementById('submitLabel');
    submitBtn.classList.add('loading');
    submitBtn.textContent = 'Sender...';
    
    try {
        // Convert canvas to blob
        const canvas = document.getElementById('labelCanvas');
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('labelImage', blob, 'label.png');
            formData.append('customerName', customerName);
            formData.append('customerEmail', customerEmail);
            formData.append('phone', document.getElementById('phone').value);
            formData.append('notes', document.getElementById('notes').value);
            formData.append('template', currentTemplate);
            
            const response = await fetch('/api/submit-label', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                showStatus('Etiketten er sendt inn! Vi kontakter deg snart.', 'success');
                // Reset form
                document.getElementById('customerName').value = '';
                document.getElementById('customerEmail').value = '';
                document.getElementById('phone').value = '';
                document.getElementById('notes').value = '';
            } else {
                throw new Error('Server error');
            }
        }, 'image/png');
    } catch (error) {
        showStatus('Det oppstod en feil. Prøv igjen eller kontakt oss direkte.', 'error');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = '<span>📤</span> Send inn etikett';
    }
}

function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';
    
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 5000);
}