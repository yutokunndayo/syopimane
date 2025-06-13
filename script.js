
document.addEventListener('DOMContentLoaded', () => {
    const beepSound = document.getElementById('beep-sound');
    const productsTableBody = document.querySelector('#products tbody');
    const totalPriceElement = document.getElementById('total-price');
    let scannedBarcodes = new Set();
    let products = JSON.parse(localStorage.getItem('products')) || [];

    function updateTotalPrice() {
        const totalPrice = products.reduce((sum, product) => sum + product.price * product.quantity, 0);
        totalPriceElement.textContent = `合計金額: ¥${totalPrice}`;
    }

    function renderProducts() {
        productsTableBody.innerHTML = '';
        products.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td contenteditable="true" data-index="${index}" data-field="name">${product.name}</td>
                <td contenteditable="true" data-index="${index}" data-field="price">${product.price}</td>
                <td contenteditable="true" data-index="${index}" data-field="quantity">${product.quantity}</td>
                <td><button data-index="${index}" class="delete-btn">削除</button></td>
            `;
            productsTableBody.appendChild(row);
        });
        updateTotalPrice();
    }

    function saveProducts() {
        localStorage.setItem('products', JSON.stringify(products));
    }

    productsTableBody.addEventListener('input', (event) => {
        const target = event.target;
        const index = target.dataset.index;
        const field = target.dataset.field;
        products[index][field] = field === 'price' || field === 'quantity' ? parseFloat(target.textContent) : target.textContent;
        saveProducts();
        updateTotalPrice();
    });

    productsTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const index = event.target.dataset.index;
            products.splice(index, 1);
            saveProducts();
            renderProducts();
        }
    });

    function onDetected(result) {
        const code = result.codeResult.code;
        if (!scannedBarcodes.has(code)) {
            scannedBarcodes.add(code);
            beepSound.play();
            fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`)
                .then(response => response.json())
                .then(data => {
                    if (data.status === 1) {
                        const product = {
                            name: data.product.product_name || '不明な商品',
                            price: parseFloat(data.product.price || 0),
                            quantity: 1
                        };
                        products.push(product);
                        saveProducts();
                        renderProducts();
                    }
                });
            setTimeout(() => scannedBarcodes.delete(code), 5000);
        }
    }

    Quagga.init({
        inputStream: {
            type: 'LiveStream',
            target: document.querySelector('#scanner')
        },
        decoder: {
            readers: ['ean_reader']
        }
    }, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected(onDetected);

    function fetchWeather() {
        fetch('https://api.open-meteo.com/v1/forecast?latitude=35.69&longitude=139.69&current_weather=true')
            .then(response => response.json())
            .then(data => {
                const weatherElement = document.getElementById('weather');
                const weather = data.current_weather;
                weatherElement.innerHTML = `
                    <p>現在の天気: ${weather.weathercode}</p>
                    <p>気温: ${weather.temperature}°C</p>
                `;
            });
    }

    fetchWeather();
    renderProducts();
});
