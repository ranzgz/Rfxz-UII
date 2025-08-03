document.addEventListener('DOMContentLoaded', async () => {
    const loadingScreen = document.getElementById("loadingScreen");
    const body = document.body;
    body.classList.add("no-scroll");

    try {
        // Load settings
        const settings = await fetch('/src/settings.json').then(res => res.json());
        
        // Try to auto-detect APIs
        let detectedAPIs = { categories: [] };
        try {
            detectedAPIs = await fetch('/api/list').then(res => res.json());
        } catch (error) {
            console.log("Using default APIs from settings.json");
        }

        // Merge detected APIs with settings
        const mergedCategories = [...settings.categories];
        
        detectedAPIs.categories.forEach(detectedCategory => {
            const existingCategoryIndex = mergedCategories.findIndex(c => 
                c.name.toLowerCase() === detectedCategory.name.toLowerCase()
            );
            
            if (existingCategoryIndex >= 0) {
                // Merge items, avoiding duplicates
                detectedCategory.items.forEach(detectedItem => {
                    const exists = mergedCategories[existingCategoryIndex].items.some(item => 
                        item.path === detectedItem.path
                    );
                    if (!exists) {
                        mergedCategories[existingCategoryIndex].items.push(detectedItem);
                    }
                });
            } else {
                // Add new category
                mergedCategories.push(detectedCategory);
            }
        });

        // Sort categories and items
        mergedCategories.sort((a, b) => a.name.localeCompare(b.name));
        mergedCategories.forEach(category => {
            category.items.sort((a, b) => a.name.localeCompare(b.name));
        });

        // Update settings with merged categories
        settings.categories = mergedCategories;

        // Set basic info from settings
        const setContent = (id, property, value) => {
            const element = document.getElementById(id);
            if (element) element[property] = value;
        };

        setContent('page', 'textContent', settings.name);
        setContent('header', 'textContent', settings.name);
        setContent('name', 'textContent', settings.name);
        setContent('version', 'textContent', settings.version);
        setContent('versionHeader', 'textContent', settings.header.status);
        setContent('description', 'textContent', settings.description);

        // Set links
        const apiLinksContainer = document.getElementById('apiLinks');
        if (settings.links?.length > 0) {
            settings.links.forEach(link => {
                const linkElement = document.createElement('a');
                linkElement.href = link.url;
                linkElement.textContent = link.name;
                linkElement.target = '_blank';
                apiLinksContainer.appendChild(linkElement);
            });
        }

        // Set random banner image
        const dynamicImage = document.getElementById('dynamicImage');
        if (dynamicImage && settings.header.imageSrc?.length > 0) {
            const randomImage = settings.header.imageSrc[
                Math.floor(Math.random() * settings.header.imageSrc.length)
            ];
            dynamicImage.src = randomImage;
            dynamicImage.style.imageRendering = "pixelated";

            const setImageSize = () => {
                const screenWidth = window.innerWidth;
                if (screenWidth < 768) {
                    dynamicImage.style.maxWidth = settings.header.imageSize.mobile || "80%";
                } else if (screenWidth < 1200) {
                    dynamicImage.style.maxWidth = settings.header.imageSize.tablet || "40%";
                } else {
                    dynamicImage.style.maxWidth = settings.header.imageSize.desktop || "40%";
                }
                dynamicImage.style.height = "auto";
            };

            setImageSize();
            window.addEventListener('resize', setImageSize);
        }

        // Display API categories and items
        const apiContent = document.getElementById('apiContent');
        apiContent.innerHTML = '';

        // Create category filter buttons
        const filterContainer = document.querySelector('.category-filters');
        
        // Add "All" button
        const allButton = document.createElement('button');
        allButton.className = 'category-filter active';
        allButton.textContent = 'All';
        allButton.dataset.filter = 'all';
        filterContainer.appendChild(allButton);

        // Add buttons for each category
        settings.categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-filter';
            button.textContent = category.name;
            button.dataset.filter = category.name.toLowerCase().replace(/[^a-z]/g, '');
            filterContainer.appendChild(button);
        });

        // Add API items
        settings.categories.forEach(category => {
            const categorySection = document.createElement('div');
            categorySection.className = 'category-section mb-5';
            categorySection.dataset.category = category.name.toLowerCase().replace(/[^a-z]/g, '');

            const categoryHeader = document.createElement('h2');
            categoryHeader.className = 'category-header';
            categoryHeader.textContent = category.name;
            categorySection.appendChild(categoryHeader);

            const categoryGrid = document.createElement('div');
            categoryGrid.className = 'row';
            
            category.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'col-md-6 col-lg-4 mb-3 api-item';
                itemElement.dataset.category = category.name.toLowerCase().replace(/[^a-z]/g, '');
                itemElement.innerHTML = `
                    <div class="api-card">
                        <h3>${item.name}</h3>
                        <p class="api-desc">${item.desc}</p>
                        <button class="btn btn-dark get-api-btn" 
                                data-api-path="${item.path}" 
                                data-api-name="${item.name}" 
                                data-api-desc="${item.desc}">
                            TEST API
                        </button>
                        ${item.innerDesc ? `<p class="api-info">${item.innerDesc}</p>` : ''}
                    </div>
                `;
                categoryGrid.appendChild(itemElement);
            });

            categorySection.appendChild(categoryGrid);
            apiContent.appendChild(categorySection);
        });

        // Category filter functionality
        document.querySelectorAll('.category-filter').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.category-filter').forEach(btn => 
                    btn.classList.remove('active')
                );
                button.classList.add('active');
                
                const filter = button.dataset.filter;
                document.querySelectorAll('.category-section, .api-item').forEach(el => {
                    if (filter === 'all') {
                        el.style.display = '';
                    } else {
                        el.style.display = el.dataset.category === filter ? '' : 'none';
                    }
                });
            });
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            document.querySelectorAll('.api-item').forEach(item => {
                const name = item.querySelector('h3').textContent.toLowerCase();
                const desc = item.querySelector('.api-desc').textContent.toLowerCase();
                const isVisible = name.includes(searchTerm) || desc.includes(searchTerm);
                item.style.display = isVisible ? '' : 'none';
                
                // Show/hide category headers based on visible items
                const categorySection = item.closest('.category-section');
                if (categorySection) {
                    const hasVisibleItems = Array.from(categorySection.querySelectorAll('.api-item'))
                        .some(i => i.style.display !== 'none');
                    categorySection.style.display = hasVisibleItems ? '' : 'none';
                }
            });
        });

        // API modal functionality
        document.addEventListener('click', async (event) => {
            if (!event.target.classList.contains('get-api-btn')) return;

            const { apiPath, apiName, apiDesc } = event.target.dataset;
            const modal = new bootstrap.Modal(document.getElementById('apiResponseModal'));
            const modalRefs = {
                label: document.getElementById('apiResponseModalLabel'),
                desc: document.getElementById('apiResponseModalDesc'),
                content: document.getElementById('apiResponseContent'),
                endpoint: document.getElementById('apiEndpoint'),
                spinner: document.getElementById('apiResponseLoading'),
                queryInputContainer: document.getElementById('apiQueryInputContainer'),
                submitBtn: document.getElementById('submitQueryBtn')
            };

            // Set modal content
            modalRefs.label.textContent = apiName;
            modalRefs.desc.textContent = apiDesc;
            modalRefs.content.textContent = '';
            modalRefs.endpoint.textContent = '';
            modalRefs.spinner.classList.add('d-none');
            modalRefs.content.classList.add('d-none');
            modalRefs.endpoint.classList.add('d-none');
            modalRefs.queryInputContainer.innerHTML = '';
            modalRefs.submitBtn.classList.add('d-none');

            // Handle API parameters if any
            let baseApiUrl = `${window.location.origin}${apiPath}`;
            let params = new URLSearchParams(apiPath.split('?')[1]);
            let hasParams = params.toString().length > 0;

            if (hasParams) {
                const paramContainer = document.createElement('div');
                paramContainer.className = 'param-container';

                const paramsArray = Array.from(params.keys());
                
                paramsArray.forEach((param, index) => {
                    const paramGroup = document.createElement('div');
                    paramGroup.className = index < paramsArray.length - 1 ? 'mb-2' : '';

                    const inputField = document.createElement('input');
                    inputField.type = 'text';
                    inputField.className = 'form-control';
                    inputField.placeholder = `Enter ${param}...`;
                    inputField.dataset.param = param;
                    inputField.required = true;
                    inputField.addEventListener('input', () => {
                        const inputs = modalRefs.queryInputContainer.querySelectorAll('input');
                        const isValid = Array.from(inputs).every(input => input.value.trim() !== '');
                        modalRefs.submitBtn.disabled = !isValid;
                    });

                    paramGroup.appendChild(inputField);
                    paramContainer.appendChild(paramGroup);
                });
                
                // Add description if available
                const currentItem = settings.categories
                    .flatMap(category => category.items)
                    .find(item => item.path === apiPath);

                if (currentItem?.innerDesc) {
                    const innerDescDiv = document.createElement('div');
                    innerDescDiv.className = 'text-muted mt-2';
                    innerDescDiv.style.fontSize = '10px';
                    innerDescDiv.innerHTML = currentItem.innerDesc.replace(/\n/g, '<br>');
                    paramContainer.appendChild(innerDescDiv);
                }

                modalRefs.queryInputContainer.appendChild(paramContainer);
                modalRefs.submitBtn.classList.remove('d-none');

                modalRefs.submitBtn.onclick = async () => {
                    const inputs = modalRefs.queryInputContainer.querySelectorAll('input');
                    const newParams = new URLSearchParams();
                    let isValid = true;

                    inputs.forEach(input => {
                        if (!input.value.trim()) {
                            isValid = false;
                            input.classList.add('is-invalid');
                        } else {
                            input.classList.remove('is-invalid');
                            newParams.append(input.dataset.param, input.value.trim());
                        }
                    });

                    if (!isValid) {
                        modalRefs.content.textContent = 'Please fill in all required fields.';
                        modalRefs.content.classList.remove('d-none');
                        return;
                    }

                    const apiUrlWithParams = `${window.location.origin}${apiPath.split('?')[0]}?${newParams.toString()}`;
                    
                    modalRefs.queryInputContainer.innerHTML = '';
                    modalRefs.submitBtn.classList.add('d-none');
                    await handleApiRequest(apiUrlWithParams, modalRefs, apiName);
                };
            } else {
                await handleApiRequest(baseApiUrl, modalRefs, apiName);
            }

            modal.show();
        });

        // Helper function to handle API requests
        async function handleApiRequest(apiUrl, modalRefs, apiName) {
            modalRefs.spinner.classList.remove('d-none');
            modalRefs.content.classList.add('d-none');

            try {
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const contentType = response.headers.get('Content-Type');
                if (contentType?.startsWith('image/')) {
                    const blob = await response.blob();
                    const imageUrl = URL.createObjectURL(blob);

                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = apiName;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.border = '2px solid #2d2d2d';
                    img.style.boxShadow = '3px 3px 0 #2d2d2d';

                    modalRefs.content.innerHTML = '';
                    modalRefs.content.appendChild(img);
                } else {
                    const data = await response.json();
                    modalRefs.content.textContent = JSON.stringify(data, null, 2);
                }

                modalRefs.endpoint.textContent = apiUrl;
                modalRefs.endpoint.classList.remove('d-none');
                modalRefs.content.classList.remove('d-none');
            } catch (error) {
                modalRefs.content.textContent = `Error: ${error.message}`;
                modalRefs.content.classList.remove('d-none');
            } finally {
                modalRefs.spinner.classList.add('d-none');
            }
        }

        // Copy button functionality
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn')) {
                const targetId = e.target.getAttribute('data-target');
                const content = document.getElementById(targetId).textContent;
                navigator.clipboard.writeText(content);
                
                // Visual feedback
                const originalText = e.target.textContent;
                e.target.textContent = 'COPIED!';
                e.target.style.backgroundColor = '#5c9e5c';
                setTimeout(() => {
                    e.target.textContent = originalText;
                    e.target.style.backgroundColor = '';
                }, 1000);
            }
        });

    } catch (error) {
        console.error('Error loading API data:', error);
    } finally {
        setTimeout(() => {
            loadingScreen.style.opacity = 0;
            setTimeout(() => {
                loadingScreen.style.display = "none";
                body.classList.remove("no-scroll");
                body.style.opacity = 1;
            }, 500);
        }, 1000);
    }
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 0) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});
