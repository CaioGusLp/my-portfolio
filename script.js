document.addEventListener('DOMContentLoaded', () => {
    // 1. Menu Mobile
    const btnMenu = document.getElementById('btn-menu');
    const menuMobile = document.getElementById('menu-mobile');
    const overlayMenu = document.getElementById('overlay-menu');
    const btnFechar = document.getElementById('btn-fechar');

    const toggleMenu = () => {
        menuMobile.classList.toggle('abrir-menu');
    };

    if (btnMenu) btnMenu.addEventListener('click', toggleMenu);
    if (btnFechar) btnFechar.addEventListener('click', toggleMenu);
    if (overlayMenu) overlayMenu.addEventListener('click', toggleMenu);

    // Fechar menu ao clicar num link
    document.querySelectorAll('.menu-mobile nav a').forEach(link => {
        link.addEventListener('click', () => {
            menuMobile.classList.remove('abrir-menu');
        });
    });

    // 2. Navegação Interativa entre as Telas de cada App (Mockups)
    const phoneMockups = document.querySelectorAll('.phone-mockup');

    phoneMockups.forEach(phone => {
        const tabButtons = phone.querySelectorAll('.screen-btn');
        const screens = phone.querySelectorAll('.app-screen');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetScreen = btn.getAttribute('data-target');

                // Atualiza botão ativo
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Mostra o ecrã correspondente
                screens.forEach(screen => {
                    if (screen.getAttribute('data-screen') === targetScreen) {
                        screen.classList.add('active');
                    } else {
                        screen.classList.remove('active');
                    }
                });
            });
        });
    });

    // 3. Filtro de Categorias de Projetos
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');

            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // 4. Feedback de envio do formulário
    const contactForm = document.getElementById('contact-form');
    const feedback = document.getElementById('form-feedback');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome').value;
            feedback.textContent = `Obrigado, ${nome}! A sua mensagem foi registada com sucesso.`;
            contactForm.reset();
        });
    }
});
