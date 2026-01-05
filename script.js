document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // QR Code Generator
    const qrText = document.getElementById('qr-text');
    const qrSize = document.getElementById('qr-size');
    const qrColor = document.getElementById('qr-color');
    const qrBgColor = document.getElementById('qr-bgcolor');
    const qrFormat = document.getElementById('qr-format');
    const qrErrorLevel = document.getElementById('qr-errorlevel');
    const generateQrBtn = document.getElementById('generate-qr');
    const qrPreview = document.getElementById('qr-preview');
    const downloadQrBtn = document.getElementById('download-qr');
    const shareQrBtn = document.getElementById('share-qr');
    const sizeValue = document.getElementById('size-value');

    // Update size value display
    qrSize.addEventListener('input', () => {
        sizeValue.textContent = `${qrSize.value}px`;
    });

    // Check if QRCode library is available
    function isQRCodeAvailable() {
        return typeof QRCode !== 'undefined' || window.QRCode;
    }

    // Generate QR Code
    generateQrBtn.addEventListener('click', generateQRCode);

    function generateQRCode() {
        const text = qrText.value.trim();
        if (!text) {
            alert('Please enter text for the QR code');
            return;
        }

        const size = parseInt(qrSize.value);
        const color = qrColor.value;
        const bgColor = qrBgColor.value;
        const format = qrFormat.value;
        const errorLevel = qrErrorLevel.value;

        // Clear previous QR code
        qrPreview.innerHTML = '';
        
        if (!isQRCodeAvailable()) {
            // Library not loaded, show error and try to load it
            qrPreview.innerHTML = '<p style="color: red;">QR Code library not loaded. Please refresh the page or check your connection.</p>';
            console.error('QRCode library not available');
            
            // Try to dynamically load the library
            loadQRCodeLibrary().then(() => {
                // Try again after loading
                setTimeout(generateQRCode, 500);
            }).catch(err => {
                console.error('Failed to load QRCode library:', err);
                qrPreview.innerHTML = '<p style="color: red;">Failed to load QR Code library. Using fallback method.</p>';
                generateQRCodeFallback(text, size, color, bgColor, format);
            });
            return;
        }

        // Library is available, use it
        try {
            // Try different methods based on library version
            if (typeof QRCode.toCanvas === 'function') {
                generateQRCodeWithCanvas(text, size, color, bgColor, errorLevel, format);
            } else if (typeof QRCode === 'function') {
                generateQRCodeLegacy(text, size, color, bgColor, format);
            } else {
                throw new Error('QRCode library has unexpected format');
            }
        } catch (error) {
            console.error('QR Code generation error:', error);
            generateQRCodeFallback(text, size, color, bgColor, format);
        }
    }

    // Load QRCode library dynamically
    function loadQRCodeLibrary() {
        return new Promise((resolve, reject) => {
            if (isQRCodeAvailable()) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
            script.onload = () => {
                // Wait a bit for the library to initialize
                setTimeout(() => {
                    if (isQRCodeAvailable()) {
                        resolve();
                    } else {
                        reject(new Error('Library loaded but QRCode not defined'));
                    }
                }, 100);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Method 1: Using QRCode.toCanvas (modern API)
    function generateQRCodeWithCanvas(text, size, color, bgColor, errorLevel, format) {
        const canvas = document.createElement('canvas');
        canvas.id = 'qr-canvas';
        
        QRCode.toCanvas(canvas, text, {
            width: size,
            margin: 1,
            color: {
                dark: color,
                light: bgColor
            },
            errorCorrectionLevel: errorLevel
        }, function(error) {
            if (error) {
                console.error('QRCode.toCanvas error:', error);
                generateQRCodeFallback(text, size, color, bgColor, format);
                return;
            }
            
            qrPreview.appendChild(canvas);
            enableQRButtons();
            addToHistory('qr', text, canvas.toDataURL(`image/${format === 'svg' ? 'png' : format}`));
        });
    }

    // Method 2: Legacy QRCode API
    function generateQRCodeLegacy(text, size, color, bgColor, format) {
        qrPreview.innerHTML = '';
        
        const qrcode = new QRCode(qrPreview, {
            text: text,
            width: size,
            height: size,
            colorDark: color,
            colorLight: bgColor,
            correctLevel: QRCode.CorrectLevel.M // Default to Medium
        });
        
        // Wait for QR code to render
        setTimeout(() => {
            const img = qrPreview.querySelector('img');
            const canvas = qrPreview.querySelector('canvas');
            
            if (img || canvas) {
                enableQRButtons();
                const dataUrl = img ? img.src : canvas.toDataURL(`image/${format === 'svg' ? 'png' : format}`);
                addToHistory('qr', text, dataUrl);
            } else {
                generateQRCodeFallback(text, size, color, bgColor, format);
            }
        }, 100);
    }

    // Fallback QR code generation (simple pattern)
    function generateQRCodeFallback(text, size, color, bgColor, format) {
        qrPreview.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = size;
        canvas.height = size;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        
        // Fill background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
        
        // Create a simple pattern
        ctx.fillStyle = color;
        const cellSize = Math.max(4, size / 25);
        
        // Draw a checkerboard pattern
        for (let x = 0; x < size; x += cellSize * 2) {
            for (let y = 0; y < size; y += cellSize * 2) {
                // Top-left square
                ctx.fillRect(x, y, cellSize, cellSize);
                // Bottom-right square
                ctx.fillRect(x + cellSize, y + cellSize, cellSize, cellSize);
            }
        }
        
        // Draw text in the center
        ctx.fillStyle = color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR', size / 2, size / 2);
        
        qrPreview.appendChild(canvas);
        enableQRButtons();
        
        const dataUrl = canvas.toDataURL(`image/${format === 'svg' ? 'png' : format}`);
        addToHistory('qr', text, dataUrl);
    }

    function enableQRButtons() {
        downloadQrBtn.disabled = false;
        shareQrBtn.disabled = false;
    }

    // Download QR Code
    downloadQrBtn.addEventListener('click', () => {
        const canvas = qrPreview.querySelector('canvas');
        const img = qrPreview.querySelector('img');
        const format = qrFormat.value;
        const text = qrText.value.substring(0, 20).replace(/[^a-z0-9]/gi, '_');
        
        if (canvas && (format === 'png' || format === 'jpeg')) {
            // Download canvas as image
            const filename = `qr_code_${text}_${Date.now()}.${format}`;
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL(`image/${format}`);
            link.click();
        } else if (img) {
            // Download img as PNG
            const filename = `qr_code_${text}_${Date.now()}.png`;
            const link = document.createElement('a');
            link.download = filename;
            link.href = img.src;
            link.click();
        } else {
            alert('No QR code to download. Please generate one first.');
        }
    });

    // Share QR Code
    shareQrBtn.addEventListener('click', async () => {
        const canvas = qrPreview.querySelector('canvas');
        const img = qrPreview.querySelector('img');
        const format = qrFormat.value;
        const text = qrText.value;

        if (!canvas && !img) {
            alert('Please generate a QR code first');
            return;
        }

        try {
            if (navigator.share) {
                const blob = await new Promise(resolve => {
                    if (canvas) {
                        canvas.toBlob(resolve, `image/${format}`);
                    } else if (img) {
                        // Convert img to blob
                        fetch(img.src)
                            .then(r => r.blob())
                            .then(resolve);
                    }
                });
                
                const file = new File([blob], 'qr-code.png', { type: `image/${format}` });
                
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'QR Code',
                        text: `QR Code for: ${text}`
                    });
                } else {
                    await navigator.share({
                        title: 'QR Code',
                        text: `QR Code for: ${text}`
                    });
                }
            } else {
                // Fallback to copy text
                await navigator.clipboard.writeText(text);
                alert('Content copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
            // Fallback to download
            downloadQrBtn.click();
        }
    });

    // Barcode Generator (keep this part exactly as before)
    const barcodeType = document.getElementById('barcode-type');
    const barcodeData = document.getElementById('barcode-data');
    const barcodeWidth = document.getElementById('barcode-width');
    const barcodeHeight = document.getElementById('barcode-height');
    const barcodeColor = document.getElementById('barcode-color');
    const showText = document.getElementById('show-text');
    const generateBarcodeBtn = document.getElementById('generate-barcode');
    const barcodePreview = document.getElementById('barcode-preview');
    const downloadBarcodeBtn = document.getElementById('download-barcode');
    const shareBarcodeBtn = document.getElementById('share-barcode');
    const widthValue = document.getElementById('width-value');
    const heightValue = document.getElementById('height-value');
    const barcodeHint = document.getElementById('barcode-hint');

    // Update barcode hint based on type
    barcodeType.addEventListener('change', updateBarcodeHint);
    
    function updateBarcodeHint() {
        const type = barcodeType.value;
        const hints = {
            'EAN13': 'EAN-13 requires 12 or 13 digits',
            'EAN8': 'EAN-8 requires 7 or 8 digits',
            'UPC': 'UPC-A requires 11 or 12 digits',
            'CODE128': 'CODE128 supports any text',
            'CODE39': 'CODE39 supports A-Z, 0-9, and -.$/+%',
            'ITF14': 'ITF-14 requires 13 or 14 digits',
            'MSI': 'MSI supports numeric digits',
            'pharmacode': 'Pharmacode supports numbers 3-131070'
        };
        barcodeHint.textContent = hints[type] || 'Enter barcode data';
    }

    // Update width and height values
    barcodeWidth.addEventListener('input', () => {
        widthValue.textContent = barcodeWidth.value;
    });

    barcodeHeight.addEventListener('input', () => {
        heightValue.textContent = `${barcodeHeight.value}px`;
    });

    // Initialize hint
    updateBarcodeHint();

    // Generate Barcode
    generateBarcodeBtn.addEventListener('click', generateBarcode);

    function generateBarcode() {
        const data = barcodeData.value.trim();
        if (!data) {
            alert('Please enter data for the barcode');
            return;
        }

        // Validate based on barcode type
        if (!validateBarcodeData(barcodeType.value, data)) {
            alert('Invalid data for selected barcode type');
            return;
        }

        const type = barcodeType.value;
        const width = parseFloat(barcodeWidth.value);
        const height = parseInt(barcodeHeight.value);
        const color = barcodeColor.value;
        const displayValue = showText.checked;

        // Clear previous barcode
        barcodePreview.innerHTML = '';
        
        // Create canvas for barcode
        const canvas = document.createElement('canvas');
        canvas.id = 'barcode-canvas';
        barcodePreview.appendChild(canvas);

        try {
            // Generate barcode
            JsBarcode(canvas, data, {
                format: type,
                width: width,
                height: height,
                displayValue: displayValue,
                fontOptions: 'bold',
                font: 'Arial',
                textMargin: 10,
                lineColor: color,
                background: '#ffffff'
            });
            
            // Enable download and share buttons
            downloadBarcodeBtn.disabled = false;
            shareBarcodeBtn.disabled = false;

            // Add to history
            addToHistory('barcode', data, canvas.toDataURL('image/png'));
            
        } catch (err) {
            barcodePreview.innerHTML = '<p style="color: red;">Error generating barcode: ' + err.message + '</p>';
            console.error(err);
        }
    }

    function validateBarcodeData(type, data) {
        const validators = {
            'EAN13': /^\d{12,13}$/,
            'EAN8': /^\d{7,8}$/,
            'UPC': /^\d{11,12}$/,
            'CODE39': /^[A-Z0-9\-\.\$\+\/%]*$/i,
            'ITF14': /^\d{13,14}$/,
            'MSI': /^\d+$/,
            'pharmacode': /^\d+$/,
            'CODE128': /^[\x00-\x7F]+$/ // ASCII characters
        };

        if (!validators[type]) return true;
        
        if (!validators[type].test(data)) {
            return false;
        }
        
        // Additional validation for specific formats
        if (type === 'EAN13' && data.length === 13) {
            // Validate EAN-13 check digit
            const checkDigit = calculateEAN13CheckDigit(data.substring(0, 12));
            return checkDigit === parseInt(data.charAt(12));
        }
        
        if (type === 'EAN8' && data.length === 8) {
            // Validate EAN-8 check digit
            const checkDigit = calculateEAN13CheckDigit(data.substring(0, 7));
            return checkDigit === parseInt(data.charAt(7));
        }
        
        return true;
    }

    function calculateEAN13CheckDigit(first12digits) {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(first12digits.charAt(i));
            sum += (i % 2 === 0) ? digit : digit * 3;
        }
        return (10 - (sum % 10)) % 10;
    }

    // Download Barcode
    downloadBarcodeBtn.addEventListener('click', () => {
        const canvas = document.getElementById('barcode-canvas');
        if (!canvas) {
            alert('Please generate a barcode first');
            return;
        }

        const text = barcodeData.value.substring(0, 20).replace(/[^a-z0-9]/gi, '_');
        const filename = `barcode_${barcodeType.value}_${text}_${Date.now()}.png`;
        
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // Share Barcode
    shareBarcodeBtn.addEventListener('click', async () => {
        const canvas = document.getElementById('barcode-canvas');
        if (!canvas) {
            alert('Please generate a barcode first');
            return;
        }

        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve));
            const file = new File([blob], 'barcode.png', { type: 'image/png' });
            
            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Barcode',
                    text: `Barcode data: ${barcodeData.value}`
                });
            } else {
                // Fallback to copy data
                await navigator.clipboard.writeText(barcodeData.value);
                alert('Barcode data copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
            // Fallback to download
            downloadBarcodeBtn.click();
        }
    });

    // History Management
    const historyList = document.getElementById('history-list');
    let history = JSON.parse(localStorage.getItem('barcodeHistory')) || [];

    function addToHistory(type, content, dataUrl) {
        const historyItem = {
            id: Date.now(),
            type: type,
            content: content,
            dataUrl: dataUrl,
            timestamp: new Date().toLocaleString()
        };

        history.unshift(historyItem);
        if (history.length > 10) history = history.slice(0, 10);
        
        localStorage.setItem('barcodeHistory', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = '';
        
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <img src="${item.dataUrl}" alt="${item.type}" style="max-width: 100px; max-height: 100px;">
                <div>
                    <strong>${item.type.toUpperCase()}</strong><br>
                    <small>${item.content.substring(0, 15)}${item.content.length > 15 ? '...' : ''}</small><br>
                    <small>${item.timestamp}</small>
                </div>
            `;
            
            div.addEventListener('click', () => {
                if (item.type === 'qr') {
                    tabBtns[0].click();
                    qrText.value = item.content;
                    generateQRCode();
                } else {
                    tabBtns[1].click();
                    barcodeData.value = item.content;
                    barcodeType.value = item.content.length === 13 ? 'EAN13' : 'CODE128';
                    updateBarcodeHint();
                    generateBarcode();
                }
            });
            
            historyList.appendChild(div);
        });
    }

    // Load history on page load
    renderHistory();

    // Try to load QRCode library on startup
    if (!isQRCodeAvailable()) {
        loadQRCodeLibrary().catch(err => {
            console.warn('QRCode library not loaded on startup:', err);
        });
    }

    // Generate initial QR code on page load
    setTimeout(() => {
        generateQRCode();
    }, 1000);
});