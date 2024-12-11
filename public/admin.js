const categories = ["gorros", "bufandas", "medias", "guantes"];

        // Función para cargar las tablas dinámicamente
        function createTables() {
            const container = document.getElementById("tables-container");
            categories.forEach(category => {
                const section = `
                    <div class="col-md-6 category-section">
                        <h4 class="text-secondary">${category[0].toUpperCase() + category.slice(1)}</h4>
                        <table class="table table-striped table-hover">
                            <thead class="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Precio</th>
                                    <th>Stock</th>
                                    <th>Imagen</th>
                                </tr>
                            </thead>
                            <tbody id="${category}-table-body"></tbody>
                        </table>
                    </div>
                `;
                container.innerHTML += section;
            });
        }

        // Función para cargar los productos desde la API
        async function fetchProducts() {
            try {
                const response = await fetch('/api/products');
                const products = await response.json();
                updateTables(products);
            } catch (error) {
                console.error("Error al obtener productos:", error);
            }
        }

        // Función para actualizar las tablas con los productos
        function updateTables(products) {
            categories.forEach(category => {
                const tbody = document.getElementById(`${category}-table-body`);
                tbody.innerHTML = ""; // Limpiar tabla
                products
                    .filter(product => product.category === category)
                    .forEach(product => {
                        const row = `
                            <tr>
                                <td>${product.id}</td>
                                <td>${product.name}</td>
                                <td>${product.price}</td>
                                <td>${product.stock}</td>
                                <td>
                                    <img src="${product.image_path}" alt="${product.name}" class="img-thumbnail">
                                </td>
                            </tr>
                        `;
                        tbody.innerHTML += row;
                    });
            });
        }

        // Función para manejar el formulario de agregar producto
        async function uploadProduct(event) {
            event.preventDefault();
            const form = document.getElementById("add-product-form");
            const formData = new FormData(form);

            try {
                const response = await fetch('/api/products', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    alert("Producto agregado con éxito.");
                    form.reset();
                    fetchProducts();
                } else {
                    alert("Error al agregar producto.");
                }
            } catch (error) {
                console.error("Error al subir el producto:", error);
            }
        }

        // Inicialización al cargar la página
        document.addEventListener("DOMContentLoaded", () => {
            createTables();
            fetchProducts();

            document.getElementById("add-product-form").addEventListener("submit", uploadProduct);
        });