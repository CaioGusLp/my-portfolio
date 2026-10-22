document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 1. TELA DE CARREGAMENTO DE CIBERSEGURANÇA (#cyber-loader)
    // =========================================================================
    const cyberLoader = document.getElementById('cyber-loader');
    const cyberLogs = document.getElementById('cyber-logs');
    const cyberPercent = document.getElementById('cyber-percent');
    const cyberProgressFill = document.getElementById('cyber-progress-fill');
    const cyberStepLabel = document.getElementById('cyber-step-label');
    const cyberStatusTitle = document.getElementById('cyber-status-title');
    const cyberHex = document.getElementById('cyber-hex');
    const cyberShieldIcon = document.getElementById('cyber-shield-icon');
    const skipLoaderBtn = document.getElementById('skip-loader');

    const securitySteps = [
        { pct: 25, label: 'AUTENTICANDO FIREWALL & WAF', log: '<span class="log-tag">[WAF]</span> Proteção anti-DDoS e filtragem de pacotes: <span class="log-ok">ATIVO</span>' },
        { pct: 55, label: 'CONECTANDO CLUSTERS DE BANCO DE DADOS', log: '<span class="log-tag">[BD-SQL]</span> Conexão segura com PostgreSQL / MySQL / MongoDB: <span class="log-ok">VERIFICADA</span>' },
        { pct: 85, label: 'CARREGANDO MÓDULOS E INTERFACES DE APPS', log: '<span class="log-tag">[UI/UX]</span> Renderizando componentes e mockups interativos...' },
        { pct: 100, label: 'ACESSO AUTORIZADO // SISTEMA PRONTO', log: '<span class="log-tag">[SEC-OK]</span> Integridade 100% validada. Bem-vindo ao portfólio CL.DEV!' }
    ];

    let currentPct = 0;
    let stepIndex = 0;

    // Efeito de código hexadecimal aleatório no topo do terminal
    const hexInterval = setInterval(() => {
        if (cyberHex) {
            const randomHex = '0x' + Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0');
            cyberHex.textContent = randomHex;
        }
    }, 120);

    const finishLoading = () => {
        clearInterval(progressInterval);
        clearInterval(hexInterval);
        if (cyberLoader) {
            cyberLoader.classList.add('hidden');
            document.body.classList.remove('loading-lock');
        }
    };

    const progressInterval = setInterval(() => {
        currentPct += 2;
        if (currentPct > 100) currentPct = 100;

        if (cyberPercent) cyberPercent.textContent = `${currentPct}%`;
        if (cyberProgressFill) cyberProgressFill.style.width = `${currentPct}%`;

        if (stepIndex < securitySteps.length && currentPct >= securitySteps[stepIndex].pct) {
            const step = securitySteps[stepIndex];
            if (cyberStepLabel) cyberStepLabel.textContent = step.label;

            if (cyberLogs) {
                const newLog = document.createElement('div');
                newLog.className = 'log-line';
                newLog.innerHTML = step.log;
                cyberLogs.appendChild(newLog);
                cyberLogs.scrollTop = cyberLogs.scrollHeight;
            }
            stepIndex++;
        }

        if (currentPct === 100) {
            if (cyberStatusTitle) {
                cyberStatusTitle.textContent = 'ACESSO AUTORIZADO // CONEXÃO SEGURA';
                cyberStatusTitle.style.color = '#00ff88';
            }
            if (cyberShieldIcon) {
                cyberShieldIcon.className = 'bi bi-shield-fill-check';
            }
            setTimeout(finishLoading, 550);
        }
    }, 45);

    if (skipLoaderBtn) {
        skipLoaderBtn.addEventListener('click', finishLoading);
    }

    // =========================================================================
    // 2. MENU MOBILE
    // =========================================================================
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

    document.querySelectorAll('.menu-mobile nav a').forEach(link => {
        link.addEventListener('click', () => {
            menuMobile.classList.remove('abrir-menu');
        });
    });

    // =========================================================================
    // 3. NAVEGAÇÃO INTERATIVA ENTRE AS TELAS DE CADA APP (MOCKUPS)
    // =========================================================================
    const phoneMockups = document.querySelectorAll('.phone-mockup');

    phoneMockups.forEach(phone => {
        const tabButtons = phone.querySelectorAll('.screen-btn');
        const screens = phone.querySelectorAll('.app-screen');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetScreen = btn.getAttribute('data-target');

                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

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

    // =========================================================================
    // 4. FILTRO DE CATEGORIAS DE PROJETOS
    // =========================================================================
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

    // =========================================================================
    // 5. REDIRECIONAMENTO DO FORMULÁRIO PARA E-MAIL E WHATSAPP
    //    E-mail: caiogustavolopezs@gmail.com | WhatsApp: 5511966076031
    // =========================================================================
    const DESTINO_EMAIL = 'caiogustavolopezs@gmail.com';
    const DESTINO_WHATSAPP = '5511966076031';

    const contactForm = document.getElementById('contact-form');
    const btnOnlyWhatsapp = document.getElementById('btn-only-whatsapp');
    const btnOnlyEmail = document.getElementById('btn-only-email');
    const feedback = document.getElementById('form-feedback');

    const getFormData = () => {
        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email').value.trim();
        const celular = document.getElementById('celular').value.trim();
        const mensagem = document.getElementById('mensagem').value.trim();
        return { nome, email, celular, mensagem };
    };

    const abrirWhatsApp = ({ nome, email, celular, mensagem }) => {
        const texto = `Olá Caio! Vim pelo seu Portfólio CL DEV.\n\n` +
                      `*Nome:* ${nome}\n` +
                      `*E-mail:* ${email}\n` +
                      `*Celular:* ${celular}\n` +
                      `*Mensagem:* ${mensagem}`;
        const urlWhatsApp = `https://wa.me/${DESTINO_WHATSAPP}?text=${encodeURIComponent(texto)}`;
        window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');
    };

    const enviarEmail = async ({ nome, email, celular, mensagem }, usarMailtoFallback = false) => {
        try {
            const response = await fetch(`https://formsubmit.co/ajax/${DESTINO_EMAIL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    Nome: nome,
                    Email: email,
                    Celular: celular,
                    Mensagem: mensagem,
                    _subject: `Novo Contato do Portfólio CL DEV - ${nome}`
                })
            });

            if (!response.ok && usarMailtoFallback) {
                throw new Error('Fallback para mailto');
            }
        } catch (err) {
            if (usarMailtoFallback) {
                const assunto = encodeURIComponent(`Contato Portfólio CL DEV - ${nome}`);
                const corpo = encodeURIComponent(`Nome: ${nome}\nE-mail: ${email}\nCelular: ${celular}\n\nMensagem:\n${mensagem}`);
                window.location.href = `mailto:${DESTINO_EMAIL}?subject=${assunto}&body=${corpo}`;
            }
        }
    };

    // Botão Principal: Envia para o E-mail e abre o WhatsApp simultaneamente
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const dados = getFormData();

            feedback.textContent = 'Redirecionando para o WhatsApp e enviando cópia para caiogustavolopezs@gmail.com...';
            abrirWhatsApp(dados);
            await enviarEmail(dados, false);

            feedback.textContent = `Perfeito, ${dados.nome}! Mensagem encaminhada para o WhatsApp e para o e-mail.`;
            contactForm.reset();
        });
    }

    // Botão Secundário: Apenas WhatsApp
    if (btnOnlyWhatsapp) {
        btnOnlyWhatsapp.addEventListener('click', () => {
            if (!contactForm.reportValidity()) return;
            const dados = getFormData();
            abrirWhatsApp(dados);
            feedback.textContent = 'Abrindo conversa no WhatsApp (11) 96607-6031...';
        });
    }

    // Botão Secundário: Apenas E-mail
    if (btnOnlyEmail) {
        btnOnlyEmail.addEventListener('click', async () => {
            if (!contactForm.reportValidity()) return;
            const dados = getFormData();
            feedback.textContent = 'Enviando mensagem para caiogustavolopezs@gmail.com...';
            await enviarEmail(dados, true);
            feedback.textContent = `Mensagem enviada para ${DESTINO_EMAIL} com sucesso!`;
            contactForm.reset();
        });
    }
});
