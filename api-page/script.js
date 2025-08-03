document.addEventListener('DOMContentLoaded', async () => {
    const loadingScreen = document.getElementById("loadingScreen");
    const body = document.body;
    body.classList.add("no-scroll");

    try {
        const settings = await fetch('/src/settings.json').then(res => res.json());

        const setContent = (id, property, value) => {
            const element = document.getElementById(id);
            if (element) element[property] = value;
        };

        const randomImageSrc =
            Array.isArray(settings.header.imageSrc) && settings.header.imageSrc.length > 0
                ? settings.header.imageSrc[Math.floor(Math.random() * settings.header.imageSrc.length)]
                : "";

        const dynamicImage = document.getElementById('dynamicImage');
        if (dynamicImage) {
            dynamicImage.src = randomImageSrc;
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
        
        setContent('page', 'textContent', settings.name || "Rynn UI");
        setContent('header', 'textContent', settings.name || "Rynn UI");
        setContent('name', 'textContent', settings.name || "Rynn UI");
        setContent('version', 'textContent', settings.version || "v1.0");
        setContent('versionHeader', 'textContent', settings.header.status || "ONLINE");

        const apiContent = document.getElementById('apiContent');
        settings.categories.forEach((category) => {
            const sortedItems = category.items.sort((a, b) => a.name.localeCompare(b.name));
            const categoryContent = sortedItems.map((item, index, array) => {
                const isLastItem = index === array.length - 1;
                const itemClass = `col-md-6 col-lg-4 api-item ${isLastItem ? 'mb-4' : 'mb-2'}`;
                return `
                    <div class="${itemClass}" data-name="${item.name}" data-desc="${item.desc}">
                        <div class="hero-section d-flex align-items-center justify-content-between">
                            <div>
                                <h5 class="mb-0" style="font-size: 14px;">${item.name}</h5>
                                <p class="mb-0" style="font-size: 10px;">${item.desc}</p>
                            </div>
                            <button class="btn btn-dark btn-sm get-api-btn" data-api-path="${item.path}" data-api-name="${item.name}" data-api-desc="${item.desc}">
                                GET
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            apiContent.insertAdjacentHTML('beforeend', `<h3 class="mb-3" style="font-size: 16px;">${category.name}</h3><div class="row">${categoryContent}</div>`);
        });

        // ... [rest of the existing script.js code remains the same] ...

    } catch (error) {
        console.error('Error loading settings:', error);
    } finally {
        setTimeout(() => {
            loadingScreen.style.display = "none";
            body.classList.remove("no-scroll");
        }, 1500);
    }
});

window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 0) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});
