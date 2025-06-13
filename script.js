document.addEventListener('DOMContentLoaded', function() {
    // Initialize QuaggaJS
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scanner'), // 映像を表示する要素
            constraints: {
                facingMode: "environment" // 背面カメラを使用（スマホ向け）
            }
        },
        decoder: {
            readers: ["ean_reader"]
        }
    }, function(err) {
        if (err) {
            console.error(err);
            return;
        }
        Quagga.start();
    });

    // Event listener for barcode detection
    Quagga.onDetected(function(result) {
        var code = result.codeResult.code;
        console.log("Barcode detected: " + code);

        // Play beep sound
        var beepSound = document.getElementById('beep-sound');
        beepSound.play();

        // Prevent duplicate scans
        if (!localStorage.getItem(code)) {
            localStorage.setItem(code, true);
            // Fetch product information from OpenFoodFacts API
            fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`)
                .then(response => response.json())
                .then(data => {
                    if (data.product) {
                        var productName = data.product.product_name;
                        var productPrice = data.product.price || 0; // Assuming price is available
                        addProductToList(productName, productPrice);
                    }
                });
        }
    });

    // Function to add product to the list
    function addProductToList(name, price) {
        var tbody = document.querySelector('#products tbody');
        var row = document.createElement('tr');
        row.innerHTML = `
            <td contenteditable="true">${name}</td>
            <td contenteditable="true">${price}</td>
            <td contenteditable="true">1</td>
            <td><button class="delete-btn">削除</button></td>
        `;
        tbody.appendChild(row);
        updateTotalPrice();
    }

    // Function to update total price
    function updateTotalPrice() {
        var total = 0;
        var rows = document.querySelectorAll('#products tbody tr');
        rows.forEach(row => {
            var price = parseFloat(row.cells[1].textContent) || 0;
            var quantity = parseInt(row.cells[2].textContent) || 1;
            total += price * quantity;
        });
        document.getElementById('total-price').textContent = `合計金額: ¥${total}`;
    }

    // Event listener for delete button
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('delete-btn')) {
            var row = event.target.closest('tr');
            row.remove();
            updateTotalPrice();
        }
    });

    // Fetch weather information from Open-Meteo API
    fetch('https://api.open-meteo.com/v1/forecast?latitude=35.69&longitude=139.69&current_weather=true')
        .then(response => response.json())
        .then(data => {
            var weather = data.current_weather;
            var weatherDiv = document.getElementById('weather');
            weatherDiv.innerHTML = `
                <p>天気: ${weather.weathercode}</p>
                <p>気温: ${weather.temperature}°C</p>
            `;
        });
});
